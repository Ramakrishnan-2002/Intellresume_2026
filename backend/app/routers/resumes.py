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
    """List all resumes belonging to the authenticated user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeRecordOut)
async def get_resume(resume_id: str, db: db_dependency, current_user: User = Depends(get_current_user)):
    """Retrieve a specific resume for the user."""
    resume = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
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
    Update resume with Optimistic Concurrency Control (OCC).
    Rejects with 409 Conflict if client version does not match database version.
    """
    resume = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Optimistic Concurrency Control check
    if resume.version != req.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "OPTIMISTIC_CONCURRENCY_CONFLICT",
                "message": f"Resume was modified by another session. Current version is {resume.version}, but client submitted version {req.version}.",
                "serverVersion": resume.version,
                "clientVersion": req.version,
            },
        )

    resume.title = req.title
    resume.status = req.status or resume.status
    resume.data = json.dumps(req.data.model_dump())
    resume.version = resume.version + 1  # Increment version on commit

    db.commit()
    db.refresh(resume)

    return ResumeRecordOut(
        id=resume.id,
        user_id=resume.user_id,
        resume_id=resume.resume_id,
        title=resume.title,
        status=resume.status,
        data=req.data,
        version=resume.version,
    )

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: str, db: db_dependency, current_user: User = Depends(get_current_user)):
    """Delete resume document."""
    resume = db.query(Resume).filter(Resume.resume_id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return None
