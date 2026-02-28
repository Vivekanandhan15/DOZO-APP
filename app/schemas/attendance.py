from pydantic import BaseModel, Field
from datetime import date
from enum import Enum

class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"

class AttendanceCreate(BaseModel):
    batch_id: int = Field(..., gt=0)
    student_id: int = Field(..., gt=0)
    status: AttendanceStatus
    date: date

class AttendanceOut(BaseModel):
    attendance_id: int
    batch_id: int
    student_id: int
    status: str
    date: date

    class Config:
        from_attributes = True
