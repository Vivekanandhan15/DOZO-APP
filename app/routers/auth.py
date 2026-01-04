from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.models.users import Users
from app.schemas.auth import LoginRequest, Token
from app.utils.hashing import verify_password
from app.utils.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login endpoint for JSON requests (frontend).
    Accepts email and password in JSON body.
    """
    user = db.query(Users).filter(Users.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.user_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.user_id}


@router.post("/token", response_model=Token)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token endpoint for Swagger UI.
    Accepts username (email) and password as form data.
    """
    user = db.query(Users).filter(Users.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid credentials")
    
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.user_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.user_id}
