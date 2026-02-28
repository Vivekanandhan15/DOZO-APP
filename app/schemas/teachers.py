from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import List

class TeacherCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str = Field("", pattern=r"^\+?1?\d{9,15}$")

class TeacherUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, pattern=r"^\+?1?\d{9,15}$")
    password: str | None = Field(None, min_length=8)

class TeacherResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str
    role: str

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)
    date: date

class StaffAttendanceMark(BaseModel):
    user_id: int = Field(..., gt=0)
    status: str = Field(..., pattern="^(PRESENT|ABSENT)$")
    date: date
