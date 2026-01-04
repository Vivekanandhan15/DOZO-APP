from datetime import date
from sqlalchemy.orm import Session
from app.models.attendance import Attendance

def mark_attendance(db, data, teacher_id):
    if db.query(Attendance).filter_by(
        student_id=data.student_id,
        date=data.date
    ).first():
        return None

    a = Attendance(**data.dict(), marked_by=teacher_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

def update_attendance(db, attendance_id, status):
    a = db.query(Attendance).filter(Attendance.attendance_id == attendance_id).first()
    if a:
        # Optional: check if date is today to allow update
        # if a.date != date.today(): return None
        a.status = status
        db.commit()
        db.refresh(a)
    return a

def get_student_attendance(db, student_id):
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()
