from sqlalchemy.orm import Session, joinedload
from app.models.students import Students
from app.models.enrollment import Enrollment
from app.schemas.students import StudentCreate, StudentUpdate


# ➕ Create student record (Admin only)
def create_student(db: Session, data: StudentCreate):
    # Prevent duplicate student for same user
    existing = db.query(Students).filter(
        Students.user_id == data.user_id
    ).first()

    if existing:
        return None

    student = Students(
        user_id=data.user_id,
        roll_no=data.roll_no,
        parent_contact=data.parent_contact,
        admission_date=data.admission_date
    )

    db.add(student)
    db.commit()
    db.refresh(student)
    return student


# 👤 Get student by USER ID
def get_student_by_user(db: Session, user_id: int):
    return db.query(Students).options(
        joinedload(Students.user),
        joinedload(Students.enrollments).joinedload(Enrollment.batch)
    ).filter(
        Students.user_id == user_id
    ).first()


# ✏️ Update student details
def update_student(db: Session, student_id: int, data: StudentUpdate):
    student = db.query(Students).filter(
        Students.student_id == student_id
    ).first()

    if not student:
        return None

    update_data = data.dict(exclude_unset=True)
    
    # Sync name, phone, email, address to Users table if present
    if any(k in update_data for k in ["name", "phone", "email", "address"]):
        user = student.user
        if user:
            if "name" in update_data: user.name = update_data["name"]
            if "phone" in update_data: user.phone = update_data["phone"]
            if "email" in update_data: user.email = update_data["email"]
            if "address" in update_data: user.address = update_data["address"]
            db.add(user)

    # Update Students table fields
    for key, value in update_data.items():
        if hasattr(student, key):
            setattr(student, key, value)

    db.commit()
    db.refresh(student)
    return student


# 📋 Get all students (Admin)
def get_all_students(db: Session):
    return db.query(Students).options(
        joinedload(Students.user),
        joinedload(Students.enrollments).joinedload(Enrollment.batch)
    ).all()

from app.models.leaves import Leaves
from app.models.attendance import Attendance
from app.models.submissions import Submissions

def delete_student(db: Session, student_id: int):
    student = db.query(Students).filter(Students.student_id == student_id).first()
    if not student:
        return False
    
    # Cascade Delete
    db.query(Enrollment).filter_by(student_id=student_id).delete()
    db.query(Leaves).filter_by(student_id=student_id).delete()
    db.query(Attendance).filter_by(student_id=student_id).delete()
    
    # Submissions uses user_id (stored in student_id column)
    if student.student_id:
        db.query(Submissions).filter_by(student_id=student.student_id).delete()

    db.delete(student)
    db.commit()
    return True

from datetime import date, timedelta
from app.models.assignments import Assignments

def calculate_streak(db: Session, student_id: int):
    student = db.query(Students).filter(Students.student_id == student_id).first()
    if not student:
        return 0
        
    today = date.today()
    
    # Already updated today?
    if student.last_streak_date == today:
        return student.streak_count
        
    yesterday = today - timedelta(days=1)
    
    # 1. Check consistency (Reset if missed a day login/check)
    # If last streak was BEFORE yesterday, it means we missed checking yesterday (so streak broken)
    if student.last_streak_date and student.last_streak_date < yesterday:
        student.streak_count = 0
        
    # 2. Check Yesterday's Performance
    # Get assignments due yesterday
    batch_ids = [e.batch_id for e in student.enrollments]
    if not batch_ids:
        # No batches -> No tasks -> Success if we maintain streak? 
        # Let's say yes for simplicity (or 0 if new)
        pass 
    
    assignments = db.query(Assignments).filter(
        Assignments.batch_id.in_(batch_ids),
        Assignments.due_date == yesterday
    ).all()
    
    success = True
    if assignments:
        # Check submissions
        assign_ids = [a.assignment_id for a in assignments]
        
        # Count submissions matches
        count = db.query(Submissions).filter(
            Submissions.student_id == student_id,
            Submissions.assignment_id.in_(assign_ids)
        ).count()
        
        if count < len(assignments):
            success = False
            
    # Update Streak
    if success:
        student.streak_count += 1
    else:
        student.streak_count = 0
        
    student.last_streak_date = today
    db.commit()
    db.refresh(student)
    
    return student.streak_count
