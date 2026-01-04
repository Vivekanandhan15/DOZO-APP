from pydantic import BaseModel
from datetime import date

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    expiry_date: date
    batch_id: int | None = None  # None means for all students

class AnnouncementUpdate(BaseModel):
    title: str
    content: str
    expiry_date: date

