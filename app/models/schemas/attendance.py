from pydantic import BaseModel
from datetime import date

class AttendanceCreate(BaseModel):
    batch_id: int
    student_id: int
    status: str  # PRESENT / ABSENT
    date: date

class AttendanceOut(BaseModel):
    attendance_id: int
    batch_id: int
    student_id: int
    status: str
    date: date

    class Config:
        from_attributes = True
