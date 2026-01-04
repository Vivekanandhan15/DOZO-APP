from pydantic import BaseModel
from datetime import date, datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    expiry_date: date
    batch_id: int | None = None  # None means for all students

class AnnouncementUpdate(BaseModel):
    title: str
    content: str
    expiry_date: date

class AnnouncementOut(BaseModel):
    announcement_id: int
    title: str
    content: str
    expiry_date: date
    batch_id: int | None
    created_at: datetime
    author_name: str
    created_by: int

    class Config:
        from_attributes = True

