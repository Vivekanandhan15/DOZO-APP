from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.schemas.announcements import AnnouncementCreate, AnnouncementUpdate, AnnouncementOut
from typing import List
from app.services.announcements import (
    create_announcement,
    update_announcement,
    delete_announcement,
    get_announcements
)

router = APIRouter(prefix="/announcements", tags=["Announcements"])

# Create (Admin / Teacher)
@router.post("/", response_model=AnnouncementOut, dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def add_announcement(data: AnnouncementCreate,
                     user=Depends(require_role(["ADMIN", "TEACHER"])),
                     db: Session = Depends(get_db)):
    return create_announcement(db, user.user_id, data)


# Update (Admin / Teacher)
@router.put("/{announcement_id}", response_model=AnnouncementOut, dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def edit_announcement(announcement_id: int, data: AnnouncementUpdate, db: Session = Depends(get_db)):
    result = update_announcement(db, announcement_id, data)
    if not result:
        raise HTTPException(status_code=400, detail="Expired or not found")
    return result


# Delete (Admin / Teacher)
@router.delete("/{announcement_id}")
def remove_announcement(announcement_id: int, 
                        user=Depends(require_role(["ADMIN", "TEACHER"])),
                        db: Session = Depends(get_db)):
    from app.models.announcements import Announcements
    announcement = db.query(Announcements).filter(Announcements.announcement_id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    # Ownership Check: Teachers can only delete their own
    if user.role.upper() == "TEACHER" and announcement.created_by != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement")
        
    result = delete_announcement(db, announcement_id)
    if not result:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}


# Student / Teacher View
@router.get("/", response_model=List[AnnouncementOut])
def view_announcements(batch_id: int | None = None, db: Session = Depends(get_db)):
    return get_announcements(db, batch_id)
