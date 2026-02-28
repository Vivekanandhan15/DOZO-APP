from pydantic import BaseModel, Field
from datetime import date, datetime

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    content: str = Field(..., min_length=3, max_length=2000)
    expiry_date: date
    batch_id: int | None = Field(None, gt=0)  # None means for all students

class AnnouncementUpdate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    content: str = Field(..., min_length=3, max_length=2000)
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

