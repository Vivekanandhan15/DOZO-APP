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

    # The service already handles syncing name/phone to user
    return update_student(db, student.student_id, data)


# 📋 Admin views all students
@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))])
def list_students(db: Session = Depends(get_db)):
    students = get_all_students(db)
    response = []
    for s in students:
        batch_name = "Unassigned"
        batch_id = None
        if s.enrollments:
            # Assuming one active enrollment or just taking the first
            if s.enrollments[0].batch:
                batch_name = s.enrollments[0].batch.name
                batch_id = s.enrollments[0].batch.batch_id
        
        response.append({
            "student_id": s.student_id,
            "user_id": s.user_id,
            "roll_no": s.roll_no,
            "parent_contact": s.parent_contact,
            "admission_date": s.admission_date,
            "user": s.user, # UserOut handles this
            "batch_name": batch_name,
            "batch_id": batch_id,
            "status": "Active" # Hardcoded for now, or add status column later
        })
    return response

from app.services.students import delete_student

@router.put("/{student_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def update_student_details(
    student_id: int, 
    data: StudentUpdate, 
    db: Session = Depends(get_db)
):
    student = update_student(db, student_id, data)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.delete("/{student_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def remove_student(student_id: int, db: Session = Depends(get_db)):
    if not delete_student(db, student_id):
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted"}

# 📊 Get Student Stats for Report Generation
@router.get("/{student_id}/report-stats", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def get_student_report_stats(student_id: int, db: Session = Depends(get_db)):
    from app.models.attendance import Attendance
    from app.models.submissions import Submissions
    from app.models.assignments import Assignments
    from sqlalchemy import func, extract
    from datetime import datetime
    
    now = datetime.now()
    
    # 1. Attendance Rate (Current Month)
    query = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        extract('month', Attendance.date) == now.month,
        extract('year', Attendance.date) == now.year
    )
    total_days = query.count()
    present_days = query.filter(Attendance.status == "PRESENT").count()
    attendance_rate = round((present_days / total_days) * 100, 1) if total_days > 0 else 0
    
  
    recent_submissions = db.query(Submissions, Assignments.title)\
        .join(Assignments, Submissions.assignment_id == Assignments.assignment_id)\
        .filter(Submissions.student_id == student_id, Submissions.grade.isnot(None))\
        .order_by(Submissions.submitted_at.desc())\
        .limit(5).all()
        
    subject_stats = []
    for sub, title in recent_submissions:
        subject_stats.append({
            "name": title,
            "marks": f"{sub.grade}/100" # Assuming 100 for now 
        })
        
    return {
        "attendance": f"{attendance_rate}%",
        "subjects": subject_stats
    }
