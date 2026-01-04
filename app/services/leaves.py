from sqlalchemy.orm import Session, joinedload
from app.models.leaves import Leaves
from app.models.students import Students

def apply_leave(db, student_id, data):
    leave = Leaves(student_id=student_id, **data.dict(), status="PENDING")
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave

def update_leave(db, leave_id, data):
    leave = db.query(Leaves).filter(Leaves.leave_id == leave_id).first()
    if leave:
        leave.status = data.status
        db.commit()
        db.refresh(leave)
    return leave

def get_student_leaves(db, student_id):
    return db.query(Leaves).filter(Leaves.student_id == student_id).all()

def get_all_leaves(db):
    return db.query(Leaves).options(
        joinedload(Leaves.student).joinedload(Students.user)
    ).all()
