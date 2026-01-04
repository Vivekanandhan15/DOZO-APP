from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.schemas.attendance import AttendanceCreate
from app.services.attendance import (
    mark_attendance,
    update_attendance,
    get_student_attendance,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

from app.services.students import get_student_by_user

# ... imports ...


# Teacher marking attendance
@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def mark(data: AttendanceCreate, 
         user=Depends(require_role(["ADMIN"])),
         db: Session = Depends(get_db)):

    teacher_id = user.user_id
    res = mark_attendance(db, data, teacher_id)

    if res is None:
        raise HTTPException(status_code=400, detail="Already marked for this date")

    return res


# Teacher updating same day attendance
@router.put("/{attendance_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def edit_attendance(attendance_id: int, status: str, db: Session = Depends(get_db)):
    res = update_attendance(db, attendance_id, status)
    if res is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot update past attendance or record not found"
        )
    return res


# Student checking their own attendance
@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_attendance(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return get_student_attendance(db, student.student_id)
