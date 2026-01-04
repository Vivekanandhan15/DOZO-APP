from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    status: str = "Pending"
    due_date: Optional[datetime] = None

class TodoCreate(TodoBase):
    pass

class TodoUpdate(TodoBase):
    title: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class TodoResponse(TodoBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
