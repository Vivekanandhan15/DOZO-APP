from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.schemas.attendance import AttendanceCreate
from app.services.students import get_student_by_user
from app.services.attendance import (
    mark_attendance,
    update_attendance,
    get_student_attendance,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

from datetime import date
from sqlalchemy import func, desc, or_
from app.models.attendance import Attendance
from app.models.batches import Batches
from app.models.leaves import Leaves
from app.models.students import Students
from app.models.enrollment import Enrollment
from app.models.users import Users

# ... imports ...


@router.get("/stats", dependencies=[Depends(require_role(["ADMIN"]))])
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    
    # 1. Total Students
    total_students = db.query(Students).count()
    
    # 2. Today's Attendance Stats
    attendance_records = db.query(Attendance).filter(Attendance.date == today).all()
    present_today = sum(1 for a in attendance_records if a.status == 'PRESENT')
    
    # Calculate absentee counts
    absent_records = sum(1 for a in attendance_records if a.status == 'ABSENT')
    
    # Approved leaves for today
    approved_leaves_today = db.query(Leaves).filter(
        Leaves.date == today,
        Leaves.status == 'APPROVED'
    ).count()
    
    # Pending leave requests (overall)
    pending_leaves_count = db.query(Leaves).filter(Leaves.status.in_(['PENDING', 'PENDING_ADMIN'])).count()
    
    # 3. Batch-wise data (limit 3)
    batches = db.query(Batches).all()
    batch_data = []
    
    for batch in batches:
        # Students in batch
        student_count = db.query(Enrollment).filter(Enrollment.batch_id == batch.batch_id).count()
        if student_count == 0:
            continue
            
        # Present in batch today
        # Join attendance -> students -> enrollment to filter by batch
        present_in_batch = db.query(Attendance).join(Students).join(Enrollment)\
            .filter(
                Attendance.date == today,
                Attendance.status == 'PRESENT',
                Enrollment.batch_id == batch.batch_id
            ).count()
            
        percentage = int((present_in_batch / student_count) * 100) if student_count > 0 else 0
        
        batch_data.append({
            "name": batch.name,
            "total_students": student_count,
            "present_count": present_in_batch,
            "percentage": percentage
        })
    
    # Limit to top 3 (or just first 3 for now)
    batch_data = batch_data[:3]
    
    # 4. Recent Leave Requests (limit 3)
    recent_leaves = db.query(Leaves).filter(Leaves.status.in_(['PENDING', 'PENDING_ADMIN']))\
        .order_by(desc(Leaves.requested_at))\
        .limit(3).all()
        
    leaves_list = []
    for leave in recent_leaves:
        name = "Unknown"
        type_str = "Unknown"
        
        if leave.student_id:
            student = db.query(Students).filter(Students.student_id == leave.student_id).first()
            user = db.query(Users).filter(Users.user_id == student.user_id).first() if student else None
            name = user.name if user else "Unknown Student"
            type_str = "Student"
        elif leave.teacher_id:
            teacher = db.query(Users).filter(Users.user_id == leave.teacher_id).first()
            name = teacher.name if teacher else "Unknown Teacher"
            type_str = "Teacher"
            
        leaves_list.append({
            "leave_id": leave.leave_id,
            "student_name": name, # Kept key for compatibility, but content is any name
            "requester_type": type_str,
            "reason": leave.reason,
            "date": leave.date.strftime("%Y-%m-%d"),
            "status": leave.status
        })

    return {
        "stats": {
            "present_today": present_today,
            "total_students": total_students,
            "overall_rate": int((present_today / total_students * 100)) if total_students > 0 else 0,
            "absent_today": absent_records,
            "on_leave": approved_leaves_today,
            "pending_leaves": pending_leaves_count
        },
        "batches": batch_data,
        "recent_leaves": leaves_list
    }
# ... imports ...


# Teacher marking attendance
@router.post("/", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def mark(data: AttendanceCreate, 
         user=Depends(require_role(["ADMIN", "TEACHER"])),
         db: Session = Depends(get_db)):

    teacher_id = user.user_id
    res = mark_attendance(db, data, teacher_id)

    if res is None:
        raise HTTPException(status_code=400, detail="Already marked for this date")

    return res


from typing import List

@router.post("/mark-bulk", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def mark_attendance_bulk(
    data: List[AttendanceCreate],
    user = Depends(require_role(["ADMIN", "TEACHER"])),
    db: Session = Depends(get_db)
):
    teacher_id = user.user_id
    success_count = 0
    today = date.today()
    is_teacher = user.role.upper() == 'TEACHER'
    
    # Validation per item (or assume batch is same day)
    for item in data:
        # Teacher Restriction: Date must be Today
        if is_teacher and item.date != today:
             raise HTTPException(status_code=400, detail="Teachers can only mark attendance for today.")

        # Check Upsert
        existing = db.query(Attendance).filter(
            Attendance.student_id == item.student_id,
            Attendance.batch_id == item.batch_id,
            Attendance.date == item.date
        ).first()
        
        if existing:
            # Teacher Restriction: Cannot Update
            if is_teacher:
                raise HTTPException(status_code=400, detail="Attendance already marked for today. Contact Admin to update.")
            
            existing.status = item.status
            existing.marked_by = teacher_id
        else:
            new_record = Attendance(
                batch_id=item.batch_id,
                student_id=item.student_id,
                status=item.status,
                date=item.date,
                marked_by=teacher_id
            )
            db.add(new_record)
        
        success_count += 1
    
    db.commit()
    return {"message": "Attendance marked", "count": success_count}


# Teacher updating same day attendance
@router.put("/{attendance_id}", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def edit_attendance(attendance_id: int, status: str, db: Session = Depends(get_db)):
    res = update_attendance(db, attendance_id, status)
    if res is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot update past attendance or record not found"
        )
    return res


@router.get("/batch/{batch_id}/date/{attendance_date}")
def get_batch_attendance(batch_id: int, attendance_date: date, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(
        Attendance.batch_id == batch_id,
        Attendance.date == attendance_date
    ).all()

# Student checking their own attendance
@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_attendance(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return get_student_attendance(db, student.student_id)
