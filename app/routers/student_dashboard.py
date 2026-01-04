from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role
from app.services.students import get_student_by_user, calculate_streak
from app.models.attendance import Attendance
from app.models.assignments import Assignments
from app.models.submissions import Submissions
from app.models.enrollment import Enrollment

router = APIRouter(prefix="/student/dashboard", tags=["Student Dashboard"])

@router.get("/stats", dependencies=[Depends(require_role(["STUDENT"]))])
def get_dashboard_stats(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # 1. Stroke Calculation (Updates DB if needed)
    streak = calculate_streak(db, student.student_id)
    
    # 2. Attendance %
    total_days = db.query(Attendance).filter(Attendance.student_id == student.student_id).count()
    present_days = db.query(Attendance).filter(
        Attendance.student_id == student.student_id,
        Attendance.status == 'PRESENT'
    ).count()
    
    attendance_pct = int((present_days / total_days) * 100) if total_days > 0 else 0
    
    # 3. Pending Tasks
    # Get all assignments for student's batches
    batch_ids = [e.batch_id for e in student.enrollments]
    
    if not batch_ids:
        pending_count = 0
    else:
        total_assignments = db.query(Assignments).filter(Assignments.batch_id.in_(batch_ids)).count()
        submitted_count = db.query(Submissions).filter(Submissions.student_id == student.student_id).count()
        pending_count = max(0, total_assignments - submitted_count)

    return {
        "name": user.name,
        "streak": streak,
        "attendance_percentage": attendance_pct,
        "avg_grade": "A+", # Placeholder or calculate if grades existed
        "pending_tasks": pending_count
    }
