from sqlalchemy.orm import Session
from app.models.announcements import Announcements

from app.models.users import Users

def create_announcement(db, user_id, data):
    a = Announcements(**data.dict(), created_by=user_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    
    # Fetch author info for response
    user = db.query(Users).filter(Users.user_id == user_id).first()
    role = user.role.capitalize() if user and user.role else "Unknown"
    name = user.name if user else "Unknown"
    a.author_name = f"{role} : {name}"
    
    return a

def update_announcement(db, announcement_id, data):
    a = db.query(Announcements).filter(Announcements.announcement_id == announcement_id).first()
    if a:
        a.title = data.title
        a.content = data.content
        a.expiry_date = data.expiry_date
        db.commit()
        db.refresh(a)
        
        # Determine author
        user = db.query(Users).filter(Users.user_id == a.created_by).first()
        role = user.role.capitalize() if user and user.role else "Unknown"
        name = user.name if user else "Unknown"
        a.author_name = f"{role} : {name}"
    return a

def delete_announcement(db, announcement_id):
    a = db.query(Announcements).filter(Announcements.announcement_id == announcement_id).first()
    if a:
        db.delete(a)
        db.commit()
        return True
    return False

def get_announcements(db, batch_id=None):
    query = db.query(Announcements, Users.name, Users.role)\
              .join(Users, Announcements.created_by == Users.user_id)
              
    if batch_id:
        query = query.filter(Announcements.batch_id == batch_id)
        
    results = query.all()
    
    out = []
    for ann, name, role in results:
        role_str = role.capitalize() if role else "Unknown"
        ann.author_name = f"{role_str} : {name}"
        out.append(ann)
    return out
