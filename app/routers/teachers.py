from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.users import Users
from app.utils.auth import require_role
from app.utils.hashing import hash_password
from pydantic import BaseModel

router = APIRouter(prefix="/teachers", tags=["Teachers"])

# --- Schemas ---
class TeacherCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""

class TeacherUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    password: str | None = None

class TeacherResponse(BaseModel):
    user_id: int
    name: str
    email: str
    phone: str
    role: str

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/", response_model=TeacherResponse)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db), current_user: Users = Depends(require_role(["ADMIN"]))):
    # Check if email exists
    existing_user = db.query(Users).filter(Users.email == teacher.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_teacher = Users(
        name=teacher.name,
        email=teacher.email,
        phone=teacher.phone,
        password=hash_password(teacher.password),
        role="teacher"
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

@router.get("/", response_model=List[TeacherResponse])
def get_all_teachers(db: Session = Depends(get_db), current_user: Users = Depends(require_role(["ADMIN"]))):
    teachers = db.query(Users).filter(Users.role == "teacher").all()
    return teachers

@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(teacher_id: int, teacher: TeacherUpdate, db: Session = Depends(get_db), current_user: Users = Depends(require_role(["ADMIN"]))):
    db_teacher = db.query(Users).filter(Users.user_id == teacher_id, Users.role == "teacher").first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if teacher.name:
        db_teacher.name = teacher.name
    if teacher.email:
         # Check duplicate if email changing
        if teacher.email != db_teacher.email:
            existing = db.query(Users).filter(Users.email == teacher.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
        db_teacher.email = teacher.email
    if teacher.phone:
        db_teacher.phone = teacher.phone
    if teacher.password:
        db_teacher.password = hash_password(teacher.password)

    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: Users = Depends(require_role(["ADMIN"]))):
    db_teacher = db.query(Users).filter(Users.user_id == teacher_id, Users.role == "teacher").first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    from sqlalchemy import text
    try:
        # We'll use direct SQL for cleanup to avoid any model/session issues
        # 1. Nullify references in dependent tables
        db.execute(text("UPDATE batches SET teacher_id = NULL WHERE teacher_id = :id"), {"id": teacher_id})
        db.execute(text("UPDATE assignments SET teacher_id = NULL WHERE teacher_id = :id"), {"id": teacher_id})
        db.execute(text("UPDATE announcements SET created_by = NULL WHERE created_by = :id"), {"id": teacher_id})
        db.execute(text("UPDATE attendance_records SET marked_by = NULL WHERE marked_by = :id"), {"id": teacher_id})
        db.execute(text("UPDATE staff_attendance SET marked_by = NULL WHERE marked_by = :id"), {"id": teacher_id})
        
        # 2. Delete private student/staff records linked to this teacher
        db.execute(text("DELETE FROM leave_requests WHERE teacher_id = :id"), {"id": teacher_id})
        db.execute(text("DELETE FROM staff_attendance WHERE user_id = :id"), {"id": teacher_id})
        db.execute(text("DELETE FROM todos WHERE user_id = :id"), {"id": teacher_id})
        
        # 3. Finally delete the user
        db.execute(text("DELETE FROM users WHERE user_id = :id"), {"id": teacher_id})
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"CRITICAL: Teacher Deletion Error for ID {teacher_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "Teacher deleted successfully"}
from app.models.leaves import Leaves
from app.models.staff_attendance import StaffAttendance
from datetime import date

# --- Additional Schemas ---
class LeaveRequestCreate(BaseModel):
    reason: str
    date: date

class StaffAttendanceMark(BaseModel):
    user_id: int
    status: str
    date: date

# --- Teacher Self Endpoints ---

@router.post("/leaves/me", dependencies=[Depends(require_role(["teacher"]))])
def request_leave_me(
    data: LeaveRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role(["teacher"]))
):
    new_leave = Leaves(
        teacher_id=current_user.user_id,
        reason=data.reason,
        date=data.date,
        status="PENDING"
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave

@router.get("/leaves/me", dependencies=[Depends(require_role(["teacher"]))])
def get_my_leaves(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role(["teacher"]))
):
    return db.query(Leaves).filter(Leaves.teacher_id == current_user.user_id).order_by(Leaves.requested_at.desc()).all()

@router.get("/attendance/me", dependencies=[Depends(require_role(["teacher"]))])
def get_my_attendance(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role(["teacher"]))
):
    return db.query(StaffAttendance).filter(StaffAttendance.user_id == current_user.user_id).order_by(StaffAttendance.date.desc()).all()


# --- Admin Staff Management ---
from app.schemas.leaves import LeaveOut
from sqlalchemy.orm import joinedload

@router.post("/attendance/mark", dependencies=[Depends(require_role(["ADMIN"]))])
def mark_staff_attendance(
    data: StaffAttendanceMark, 
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role(["ADMIN"]))
):
    # Check if existing
    existing = db.query(StaffAttendance).filter(
        StaffAttendance.user_id == data.user_id,
        StaffAttendance.date == data.date
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this user on this date"
        )
    
    record = StaffAttendance(
        user_id=data.user_id,
        status=data.status,
        date=data.date,
        marked_by=current_user.user_id
    )
    db.add(record)
    
    db.commit()
    return {"message": "Attendance marked"}

@router.get("/leaves/all", dependencies=[Depends(require_role(["ADMIN"]))], response_model=List[LeaveOut])
def get_all_staff_leaves(db: Session = Depends(get_db)):
    # Only teacher leaves
    return db.query(Leaves).options(joinedload(Leaves.teacher)).filter(Leaves.teacher_id != None).order_by(Leaves.requested_at.desc()).all()
