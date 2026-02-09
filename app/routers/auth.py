from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
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
    try:
        print(f"DEBUG: Login attempt for email: {login_data.email}")
        user = db.query(Users).filter(func.lower(Users.email) == login_data.email.lower()).first()
        
        if not user:
            print(f"DEBUG: User not found: {login_data.email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        if not verify_password(login_data.password, user.password):
            print(f"DEBUG: Password verification failed for: {login_data.email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        access_token = create_access_token(data={"sub": user.email, "user_id": user.user_id, "role": user.role})
        print(f"DEBUG: Login successful for: {login_data.email}, Role: {user.role}")
        return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.user_id}
    except Exception as e:
        print(f"ERROR: Unexpected error during login: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/token", response_model=Token)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(OAuth2PasswordRequestForm),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token endpoint for Swagger UI.
    Accepts username (email) and password as form data.
    """
    user = db.query(Users).filter(func.lower(Users.email) == form_data.username.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.user_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.user_id}
