from sqlalchemy.orm import Session
from app.models.enrollment import Enrollment
from app.schemas.enrollment import EnrollStudent

def enroll_student(db: Session, data: EnrollStudent):
    
    # Student can only be in ONE batch
    already = db.query(Enrollment).filter(
        Enrollment.student_id == data.student_id
    ).first()
    
    if already:
        return None
    
    enroll = Enrollment(**data.dict())
    db.add(enroll)
    db.commit()
    db.refresh(enroll)
    return enroll


def get_students_in_batch(db: Session, batch_id: int):
    return db.query(Enrollment).filter(Enrollment.batch_id == batch_id).all()


def get_student_batch(db: Session, student_id: int):
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).first()
    