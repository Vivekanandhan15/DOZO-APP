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
from app.schemas.users import UserOut

class LeaveOut(BaseModel):
    leave_id: int
    student_id: Optional[int] = None
    teacher_id: Optional[int] = None
    date: date
    status: str
    reason: str
    student: Optional[StudentOut] = None
    teacher: Optional[UserOut] = None

    class Config:
        from_attributes = True
