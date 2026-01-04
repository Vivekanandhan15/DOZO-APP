from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role
from app.models.students import Students
from app.models.assignments import Assignments
from app.models.leaves import Leaves

from app.models.todo import Todo
from app.models.announcements import Announcements
from app.utils.auth import get_current_user, require_role
from app.models.users import Users

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    total_students = db.query(Students).count()
    active_tasks = db.query(Assignments).count() # Or filter by status if needed
    pending_leaves = db.query(Leaves).filter(Leaves.status == "PENDING").count()
    
    # Calculate Attendance Rate (Mock logic or real calculation)
    # Ideally: (Total Present / Total Records) * 100
    # For now, we can query Attendance table if it exists
    from app.models.attendance import Attendance
    total_recs = db.query(Attendance).count()
    present_recs = db.query(Attendance).filter(Attendance.status == "PRESENT").count()
    
    attendance_rate = 0
    if total_recs > 0:
        attendance_rate = round((present_recs / total_recs) * 100, 1)

    return {
        "user_name": current_user.name,
        "total_students": total_students,
        "active_tasks": active_tasks,
        "pending_leaves": pending_leaves,
        "attendance_rate": attendance_rate
    }

from app.models.batches import Batches
from app.models.enrollment import Enrollment

@router.get("/schedule", dependencies=[Depends(require_role(["ADMIN"]))])
def get_todays_schedule(db: Session = Depends(get_db)):
    # Fetch active batches.
    # Logic: Batches that started before/on today and haven't ended? 
    # Or just all batches for simplicity since we deleted old ones.
    batches = db.query(Batches).all()
    
    schedule = []
    for b in batches:
        student_count = db.query(Enrollment).filter(Enrollment.batch_id == b.batch_id).count()
        schedule.append({
            "batch_name": b.name,
            "time": b.time or "09:00 - 11:00 AM", # Default if null
            "student_count": student_count,
            "room": "Room 101", # Placeholder or add to model
            "status": "In Progress" # Placeholder logic
        })
    return schedule

@router.get("/todos/top")
def get_top_todos(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    todos = db.query(Todo).filter(
        Todo.user_id == current_user.user_id,
        Todo.status == "Pending",
        Todo.priority == "High"
    ).limit(3).all()
    return todos

@router.get("/announcements/latest")
def get_latest_announcements(db: Session = Depends(get_db)):
    return db.query(Announcements).order_by(Announcements.created_at.desc()).limit(3).all()
