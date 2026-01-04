from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.users import UserCreate
from app.services.users import create_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/signup")
def signup(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = create_user(db, data)
        if not user:
            raise HTTPException(400, "Email already exists")
        return user
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

from app.utils.auth import get_current_user

@router.get("/me")
def get_my_profile(current_user = Depends(get_current_user)):
    return current_user
