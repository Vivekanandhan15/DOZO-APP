from sqlalchemy.orm import Session
from app.models.batches import Batches
from app.models.enrollment import Enrollment

def create_batch(db, data):
    batch = Batches(**data.dict())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

from app.models.assignments import Assignments
from app.models.attendance import Attendance
from app.models.submissions import Submissions

def delete_batch(db, batch_id):
    # Cascade delete mechanism
    # 1. Delete Enrollments
    db.query(Enrollment).filter_by(batch_id=batch_id).delete()
    
    # 1.5 Delete Submissions linked to Assignments of this Batch
    # Find assignments in this batch
    assignments_query = db.query(Assignments.assignment_id).filter_by(batch_id=batch_id)
    db.query(Submissions).filter(Submissions.assignment_id.in_(assignments_query)).delete(synchronize_session=False)

    # 2. Delete Assignments
    db.query(Assignments).filter_by(batch_id=batch_id).delete()
    
    # 3. Delete Attendance
    db.query(Attendance).filter_by(batch_id=batch_id).delete()
    
    batch = db.query(Batches).get(batch_id)
    if batch:
        db.delete(batch)
        db.commit()
        return True
    return False

def get_all_batches(db):
    return db.query(Batches).all()

def update_batch(db, batch_id, data):
    batch = db.query(Batches).filter(Batches.batch_id == batch_id).first()
    if batch:
        batch.name = data.name
        batch.teacher_id = data.teacher_id
        batch.start_date = data.start_date
        batch.end_date = data.end_date
        db.commit()
        db.refresh(batch)
    return batch
