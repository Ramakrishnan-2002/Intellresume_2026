from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from ..schemas import Token, UserCreate, UserOut
from ..database import db_dependency
from ..models import User
from ..utils import verify_password, hash_password
from ..OAuth2 import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=dict)
async def register(user: UserCreate, db: db_dependency):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    new_user = User(
        email=user.email,
        password=hash_password(user.password),
        name=user.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"success": "Account created successfully", "user": UserOut.model_validate(new_user)}

@router.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token(data={"id": user.id, "email": user.email, "name": user.name})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(lambda db, token: None)):
    # Placeholder – wire up with get_current_user when auth is enforced
    from ..OAuth2 import get_current_user
    return current_user
