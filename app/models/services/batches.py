from sqlalchemy.orm import Session
from app.models.batches import Batches
from app.models.enrollment import Enrollment

def create_batch(db, data):
    batch = Batches(**data.dict())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

def delete_batch(db, batch_id):
    if db.query(Enrollment).filter_by(batch_id=batch_id).first():
        return None
    batch = db.query(Batches).get(batch_id)
    if batch:
        db.delete(batch)
        db.commit()
        return True

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
