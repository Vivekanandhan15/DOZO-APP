from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.students import StudentCreate, StudentUpdate
from app.services.students import (
    create_student,
    get_student_by_user,
    update_student,
    get_all_students
)
from app.utils.auth import require_role

router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def add_student(
    data: StudentCreate,
    db: Session = Depends(get_db)
):
    student = create_student(db, data)
    if not student:
        raise HTTPException(
            status_code=400,
            detail="Student already exists for this user"
        )
    return student



@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_student_profile(
    user = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    return student


@router.put("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def update_my_profile(
    data: StudentUpdate,
    user = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    return update_student(db, student.student_id, data)


# 📋 Admin views all students
@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))])
def list_students(db: Session = Depends(get_db)):
    students = get_all_students(db)
    response = []
    for s in students:
        batch_name = "Unassigned"
        if s.enrollments:
            # Assuming one active enrollment or just taking the first
            # We need to access the batch relationship of the enrollment
            # Warning: s.enrollments is a list of Enrollment objects
            # Enrollment has 'batch' relationship
            if s.enrollments[0].batch:
                batch_name = s.enrollments[0].batch.name
        
        response.append({
            "student_id": s.student_id,
            "user_id": s.user_id,
            "roll_no": s.roll_no,
            "parent_contact": s.parent_contact,
            "admission_date": s.admission_date,
            "user": s.user, # UserOut handles this
            "batch_name": batch_name,
            "status": "Active" # Hardcoded for now, or add status column later
        })
    return response
