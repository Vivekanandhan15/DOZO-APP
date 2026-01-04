from sqlalchemy.orm import Session
from app.models.assignments import Assignments
from app.models.submissions import Submissions

def create_assignment(db, data, teacher_id):
    a = Assignments(**data.dict(), teacher_id=teacher_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

def delete_assignment(db, assignment_id):
    if db.query(Submissions).filter_by(assignment_id=assignment_id).first():
        return None
    a = db.query(Assignments).get(assignment_id)
    if a:
        db.delete(a)
        db.commit()
        return True

def get_assignments_by_batch(db, batch_id):
    return db.query(Assignments).filter(Assignments.batch_id == batch_id).all()
