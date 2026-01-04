from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models.users import Users
from app.models.students import Students
from app.models.batches import Batches
from app.models.leaves import Leaves
from app.models.attendance import Attendance
from app.utils.auth import require_role
from datetime import date
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/teacher/dashboard", tags=["Teacher Dashboard"])

class BatchInfo(BaseModel):
    id: int
    name: str
    time: str | None = None

class LeaveInfo(BaseModel):
    leave_id: int
    student_name: str
    reason: str
    date: date
    status: str

class TeacherStats(BaseModel):
    teacher_name: str
    total_students: int
    attendance_rate: int
    pending_leaves: int
    batches: List[BatchInfo]
    recent_leaves: List[LeaveInfo]

from app.models.enrollment import Enrollment

class StudentList(BaseModel):
    name: str
    roll_no: str
    batch_name: str
    attendance_rate: int
    contact: str
    student_id: int
    batch_id: int

@router.get("/students", response_model=List[StudentList])
def get_my_students(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role("teacher"))
):
    # Get Teacher's Batches
    batches = db.query(Batches).filter(Batches.teacher_id == current_user.user_id).all()
    batch_ids = [b.batch_id for b in batches]
    
    if not batch_ids:
        return []

    # Get Students via Enrollment
    enrollments = db.query(Enrollment).filter(Enrollment.batch_id.in_(batch_ids)).all()
    
    student_list = []
    for enr in enrollments:
        student = enr.student
        if not student: continue
        
        user = student.user
        batch = enr.batch
        
        # Calculate Attendance for this student in this batch
        total = db.query(Attendance).filter(Attendance.student_id == student.student_id, Attendance.batch_id == batch.batch_id).count()
        present = db.query(Attendance).filter(Attendance.student_id == student.student_id, Attendance.batch_id == batch.batch_id, Attendance.status == 'PRESENT').count()
        rate = int((present / total) * 100) if total > 0 else 0
        
        student_list.append(StudentList(
            name=user.name,
            roll_no=student.roll_no,
            batch_name=batch.name,
            attendance_rate=rate,
            contact=user.phone or "null",
            student_id=student.student_id,
            batch_id=batch.batch_id
        ))
    
    return student_list

class LeaveDetail(BaseModel):
    leave_id: int
    student_name: str
    batch_name: str
    date: date
    reason: str
    status: str

@router.get("/leaves", response_model=List[LeaveDetail])
def get_teacher_leaves(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role("teacher"))
):
    # Get Batches
    batches = db.query(Batches).filter(Batches.teacher_id == current_user.user_id).all()
    batch_ids = [b.batch_id for b in batches]
    if not batch_ids: return []

    # Get Enrollments for Batch Names mapping
    enrollments = db.query(Enrollment).filter(Enrollment.batch_id.in_(batch_ids)).all()
    student_batch_map = {e.student_id: e.batch.name for e in enrollments}
    student_ids = list(student_batch_map.keys())

    if not student_ids: return []

    # Query Leaves
    # Only get leaves that actually have a student_id from our list
    # student_ids is a list of integers from student_batch_map.keys()
    leaves = db.query(Leaves).filter(
        Leaves.student_id.in_(student_ids),
        Leaves.student_id != None  # Extra safety
    ).order_by(Leaves.requested_at.desc()).all()

    result = []
    for l in leaves:
        student = db.query(Students).filter(Students.student_id == l.student_id).first()
        if not student: continue
        
        user = db.query(Users).filter(Users.user_id == student.user_id).first()
        if not user:
             # This student record exists but no user record? Orphaned. 
             continue 

        result.append(LeaveDetail(
            leave_id=l.leave_id,
            student_name=user.name,
            batch_name=student_batch_map.get(l.student_id, "Unknown"),
            date=l.date,
            reason=l.reason,
            status=l.status
        ))
    
    return result

@router.get("/stats", response_model=TeacherStats)
def get_teacher_stats(
    db: Session = Depends(get_db), 
    current_user: Users = Depends(require_role("teacher"))
):
    # 1. Get Batches
    batches = db.query(Batches).filter(Batches.teacher_id == current_user.user_id).all()
    batch_ids = [b.batch_id for b in batches]

    # 2. Get Students Count via Enrollment
    total_students = db.query(Enrollment).filter(Enrollment.batch_id.in_(batch_ids)).count() if batch_ids else 0

    # 3. Attendance Rate
    total_attendance = db.query(Attendance).filter(Attendance.batch_id.in_(batch_ids)).count() if batch_ids else 0
    present_attendance = db.query(Attendance).filter(Attendance.batch_id.in_(batch_ids), Attendance.status == 'PRESENT').count() if batch_ids else 0
    
    rate = 0
    if total_attendance > 0:
        rate = int((present_attendance / total_attendance) * 100)

    # 4. Pending Leaves
    # Get student IDs from enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.batch_id.in_(batch_ids)).all() if batch_ids else []
    student_ids = [e.student_id for e in enrollments if e.student_id is not None]

    pending_leaves_count = 0
    recent_leaves_list = []

    if student_ids:
        # Teacher sees PENDING requests for their students
        pending_leaves_query = db.query(Leaves).filter(
            Leaves.student_id.in_(student_ids),
            Leaves.student_id != None,
            Leaves.status == 'PENDING'
        )
        pending_leaves_count = pending_leaves_query.count()
        
        recent_leaves = pending_leaves_query.order_by(Leaves.requested_at.desc()).limit(5).all()
        for l in recent_leaves:
            student = db.query(Students).filter(Students.student_id == l.student_id).first()
            if not student: continue
            
            user = db.query(Users).filter(Users.user_id == student.user_id).first()
            if not user: continue
            
            student_name = user.name

            recent_leaves_list.append(LeaveInfo(
                leave_id=l.leave_id,
                student_name=student_name,
                reason=l.reason,
                date=l.date,
                status=l.status
            ))

    batch_infos = [BatchInfo(id=b.batch_id, name=b.name, time=getattr(b, 'time', 'N/A')) for b in batches]

    return TeacherStats(
        teacher_name=current_user.name,
        total_students=total_students,
        attendance_rate=rate,
        pending_leaves=pending_leaves_count,
        batches=batch_infos,
        recent_leaves=recent_leaves_list
    )
