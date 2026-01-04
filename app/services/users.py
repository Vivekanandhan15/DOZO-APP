from sqlalchemy.orm import Session
from app.models.users import Users
from app.utils.hashing import hash_password

def create_user(db: Session, data):
    if db.query(Users).filter(Users.email == data.email).first():
        return None

    user = Users(
        name=data.name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
