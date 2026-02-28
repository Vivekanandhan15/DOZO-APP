from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role
from app.models.students import Students
from app.models.assignments import Assignments
from app.models.leaves import Leaves
from app.models.submissions import Submissions
from app.models.enrollment import Enrollment
from app.models.batches import Batches
from app.models.todo import Todo
from app.models.announcements import Announcements
from app.utils.auth import get_current_user, require_role
from app.models.users import Users
from app.utils.timezone_utils import get_ist_now

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    from datetime import timedelta
    from app.models.attendance import Attendance
    from app.models.submissions import Submissions
    
    # Current stats
    total_students = db.query(Students).count()
    active_tasks = db.query(Assignments).count()
    pending_leaves = db.query(Leaves).filter(Leaves.status.in_(['PENDING', 'PENDING_ADMIN'])).count()
    
    # Attendance Rate (current)
    total_recs = db.query(Attendance).count()
    present_recs = db.query(Attendance).filter(Attendance.status == "PRESENT").count()
    attendance_rate = round((present_recs / total_recs) * 100, 1) if total_recs > 0 else 0
    
    # Attendance yesterday (for change calculation)
    now = get_ist_now()
    yesterday_date = now.date() - timedelta(days=1)
    yesterday_total = db.query(Attendance).filter(Attendance.date == yesterday_date).count()
    yesterday_present = db.query(Attendance).filter(Attendance.date == yesterday_date, Attendance.status == "PRESENT").count()
    yesterday_rate = round((yesterday_present / yesterday_total) * 100, 1) if yesterday_total > 0 else attendance_rate
    attendance_change = round(attendance_rate - yesterday_rate, 1)
    
    # Tasks change (comparing last 7 days vs previous 7 days)
    last_week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    
    current_tasks = db.query(Assignments).filter(Assignments.created_at >= last_week_start).count()
    prev_tasks = db.query(Assignments).filter(Assignments.created_at >= prev_week_start, Assignments.created_at < last_week_start).count()
    
    if prev_tasks > 0:
        tasks_change = round(((current_tasks - prev_tasks) / prev_tasks) * 100, 1)
    else:
        tasks_change = 100.0 if current_tasks > 0 else 0.0
    
    # Average Performance (from submissions)
    from sqlalchemy import func
    avg_perf_query = db.query(func.avg(Submissions.grade)).filter(Submissions.grade.isnot(None))
    avg_performance = round(float(avg_perf_query.scalar() or 0), 1)
    
    # Performance change (comparing last 7 days vs previous 7 days)
    current_avg = avg_perf_query.filter(Submissions.submitted_at >= last_week_start).scalar() or 0
    prev_avg = avg_perf_query.filter(Submissions.submitted_at >= prev_week_start, Submissions.submitted_at < last_week_start).scalar() or 0
    performance_change = round(float(current_avg) - float(prev_avg), 1)
    
    # Pending reviews count (submissions without grades)
    pending_reviews = db.query(Submissions).filter(Submissions.grade.is_(None)).count()

    return {
        "user_name": current_user.name,
        "total_students": total_students,
        "active_tasks": active_tasks,
        "tasks_change": tasks_change,
        "pending_leaves": pending_leaves,
        "attendance_rate": attendance_rate,
        "attendance_change": attendance_change,
        "avg_performance": avg_performance,
        "performance_change": performance_change,
        "pending_reviews": pending_reviews
    }

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

@router.get("/tasks/stats")
def get_task_stats(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    from datetime import timedelta
    
    # Total active tasks
    total_tasks = db.query(Assignments).count()
    
    # Pending review - submissions without grades
    pending_review = db.query(Submissions).filter(Submissions.grade.is_(None)).count()
    
    # Completed this month - submissions with grades from this month
    current_month_start = get_ist_now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    completed_this_month = db.query(Submissions).filter(
        Submissions.grade.isnot(None),
        Submissions.submitted_at >= current_month_start
    ).count()
    
    # Overdue - assignments where due_date has passed
    now = get_ist_now().date()  # Convert to date for comparison
    overdue = db.query(Assignments).filter(Assignments.due_date < now).count()
    
    return {
        "total_tasks": total_tasks,
        "pending_review": pending_review,
        "completed": completed_this_month,
        "overdue": overdue
    }

@router.get("/tasks/recent")
def get_recent_tasks(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    from sqlalchemy import func
    
    # Get recent assignments (limit 10)
    assignments = db.query(Assignments).order_by(Assignments.created_at.desc()).limit(10).all()
    
    result = []
    for assignment in assignments:
        # Count total submissions for this assignment
        total_submissions = db.query(Submissions).filter(
            Submissions.assignment_id == assignment.assignment_id
        ).count()
        
        # Get total students enrolled if batch exists
        total_students = 0
        batch_name = "N/A"
        if assignment.batch_id:
            batch = db.query(Batches).filter(Batches.batch_id == assignment.batch_id).first()
            if batch:
                batch_name = batch.name
                total_students = db.query(Enrollment).filter(
                    Enrollment.batch_id == assignment.batch_id
                ).count()
        
        # Determine status based on due date and submission count
        now = get_ist_now().date()  # Convert to date for comparison
        if assignment.due_date < now:
            status = "Overdue"
        elif total_submissions >= total_students and total_students > 0:
            status = "Completed"
        elif total_submissions > 0:
            status = "In Progress"
        else:
            status = "Active"
        
        result.append({
            "assignment_id": assignment.assignment_id,
            "title": assignment.title,
            "description": assignment.description,
            "batch_name": batch_name,
            "owner_name": assignment.teacher.name if assignment.teacher else "Admin",
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "submissions": f"{total_submissions}/{total_students}" if total_students > 0 else f"{total_submissions}",
            "status": status
        })
    
    return result
