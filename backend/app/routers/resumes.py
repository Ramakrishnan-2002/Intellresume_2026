import json
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from ..database import db_dependency
from ..models import Resume, User
from ..schemas import ResumeSaveRequest, ResumeRecordOut, ResumeListItem, ResumeData
from ..OAuth2 import get_current_user

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

@router.get("", response_model=List[ResumeListItem])
async def list_resumes(db: db_dependency, current_user: User = Depends(get_current_user)):
    """List all resumes belonging strictly to the authenticated user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeRecordOut)
async def get_resume(resume_id: str, db: db_dependency, current_user: User = Depends(get_current_user)):
    """Retrieve a specific resume strictly owned by the authenticated user."""
    resume = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        # Check if it exists for another user to verify isolation (for internal security audit)
        cross_user = db.query(Resume).filter(Resume.resume_id == resume_id).first()
        if cross_user:
            # Resource exists but owned by someone else -> prevent BOLA/IDOR
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this resume")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    parsed_data = json.loads(resume.data)
    return ResumeRecordOut(
        id=resume.id,
        user_id=resume.user_id,
        resume_id=resume.resume_id,
        title=resume.title,
        status=resume.status,
        data=ResumeData.model_validate(parsed_data),
        version=resume.version,
    )

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ResumeRecordOut)
async def create_resume(req: ResumeSaveRequest, db: db_dependency, current_user: User = Depends(get_current_user)):
    """Create a new resume document."""
    resume_id = req.data.id or f"RES-{current_user.id}-{int(req.data.title.__hash__() % 10000)}"
    existing = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume with this ID already exists. Use PUT to update.")

    new_resume = Resume(
        user_id=current_user.id,
        resume_id=resume_id,
        title=req.title,
        status=req.status or "DRAFT",
        data=json.dumps(req.data.model_dump()),
        version=1,
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return ResumeRecordOut(
        id=new_resume.id,
        user_id=new_resume.user_id,
        resume_id=new_resume.resume_id,
        title=new_resume.title,
        status=new_resume.status,
        data=req.data,
        version=new_resume.version,
    )

@router.put("/{resume_id}", response_model=ResumeRecordOut)
async def update_resume(
    resume_id: str,
    req: ResumeSaveRequest,
    db: db_dependency,
    current_user: User = Depends(get_current_user),
):
    """
    Update resume with TRUE ATOMIC Optimistic Concurrency Control (Compare-And-Swap).
    Atomically updates WHERE version == req.version.
    If 0 rows were updated, checks whether it was a version conflict or non-existent document.
    """
    # 1. Check ownership & existence first to handle BOLA
    existing = db.query(Resume).filter(Resume.resume_id == resume_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if existing.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you do not own this resume")

    # 2. Atomic Compare-And-Swap (CAS) in database transaction
    rows_affected = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.id,
        Resume.version == req.version,  # Compare version atomically
    ).update(
        {
            Resume.title: req.title,
            Resume.status: req.status or "DRAFT",
            Resume.data: json.dumps(req.data.model_dump()),
            Resume.version: Resume.version + 1,  # Swap version
        },
        synchronize_session=False,
    )

    if rows_affected == 0:
        # Atomic update failed because current version in DB != req.version
        db.rollback()
        current_in_db = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
        current_ver = current_in_db.version if current_in_db else "unknown"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "OPTIMISTIC_CONCURRENCY_CONFLICT",
                "message": f"Resume was modified by another session. Current version is {current_ver}, but client submitted version {req.version}.",
                "serverVersion": current_ver,
                "clientVersion": req.version,
            },
        )

    db.commit()
    updated = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()

    return ResumeRecordOut(
        id=updated.id,
        user_id=updated.user_id,
        resume_id=updated.resume_id,
        title=updated.title,
        status=updated.status,
        data=req.data,
        version=updated.version,
    )

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: str, db: db_dependency, current_user: User = Depends(get_current_user)):
    """Delete resume document strictly verifying ownership."""
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you do not own this resume")
    db.delete(resume)
    db.commit()
    return None
