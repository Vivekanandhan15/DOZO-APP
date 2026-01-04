from pydantic import BaseModel
from datetime import date
from typing import Optional

class LeaveApply(BaseModel):
    date: date
    reason: str

class LeaveUpdate(BaseModel):
    status: str  # APPROVED / REJECTED
    feedback: str | None = None  # optionally extend in future

from app.schemas.students import StudentOut

class LeaveOut(BaseModel):
    leave_id: int
    student_id: int
    date: date
    status: str
    reason: str
    student: Optional[StudentOut] = None

    class Config:
        from_attributes = True
