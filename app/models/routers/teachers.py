from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import Base,get_db
from app.utils.auth import require_role, get_current_user

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))])
def list_teachers(db: Session = Depends(get_db)):
    return db.execute("SELECT * FROM mentors").fetchall()
