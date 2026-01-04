from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.schemas.announcements import AnnouncementCreate, AnnouncementUpdate
from app.services.announcements import (
    create_announcement,
    update_announcement,
    delete_announcement,
    get_announcements
)

router = APIRouter(prefix="/announcements", tags=["Announcements"])

# Create (Admin / Teacher)
@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def add_announcement(data: AnnouncementCreate,
                     user=Depends(require_role(["ADMIN"])),
                     db: Session = Depends(get_db)):
    return create_announcement(db, user.user_id, data)


# Update (Admin / Teacher)
@router.put("/{announcement_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def edit_announcement(announcement_id: int, data: AnnouncementUpdate, db: Session = Depends(get_db)):
    result = update_announcement(db, announcement_id, data)
    if not result:
        raise HTTPException(status_code=400, detail="Expired or not found")
    return result


# Delete (Admin only)
@router.delete("/{announcement_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def remove_announcement(announcement_id: int, db: Session = Depends(get_db)):
    result = delete_announcement(db, announcement_id)
    if not result:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted"}


# Student / Teacher View
@router.get("/")
def view_announcements(batch_id: int | None = None, db: Session = Depends(get_db)):
    return get_announcements(db, batch_id)
