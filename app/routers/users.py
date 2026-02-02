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
from app.models.users import Users
from app.schemas.users import PasswordUpdate
from app.utils.hashing import hash_password

@router.put("/me/password")
def update_my_password(
    data: PasswordUpdate, 
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.utils.hashing import verify_password
    
    # 1. Verify old password
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
        
    # 2. Verify new password confirmation
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # 3. Update password
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/setup-admin")
def setup_initial_admin(data: UserCreate, db: Session = Depends(get_db)):
    # Check if this exact email exists
    if db.query(Users).filter(Users.email == data.email).first():
        raise HTTPException(400, "User already exists")
    
    # Force role to Admin
    new_admin = Users(
        name=data.name,
        email=data.email,
        phone=data.phone,
        role="ADMIN",
        password=hash_password(data.password)
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return {"message": "Admin user created successfully", "user": new_admin.email}

@router.get("/me")
def get_my_profile(current_user = Depends(get_current_user)):
    return current_user
