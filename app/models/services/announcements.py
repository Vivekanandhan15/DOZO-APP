from sqlalchemy.orm import Session
from app.models.announcements import Announcements

def create_announcement(db, user_id, data):
    a = Announcements(**data.dict(), created_by=user_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

def update_announcement(db, announcement_id, data):
    a = db.query(Announcements).filter(Announcements.announcement_id == announcement_id).first()
    if a:
        a.title = data.title
        a.content = data.content
        a.expiry_date = data.expiry_date
        db.commit()
        db.refresh(a)
    return a

def delete_announcement(db, announcement_id):
    a = db.query(Announcements).filter(Announcements.announcement_id == announcement_id).first()
    if a:
        db.delete(a)
        db.commit()
        return True
    return False

def get_announcements(db, batch_id=None):
    query = db.query(Announcements)
    if batch_id:
        query = query.filter(Announcements.batch_id == batch_id)
    return query.all()
