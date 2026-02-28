from pydantic import BaseModel, Field
from datetime import date
from typing import List

# For creating a student entry in DB
class StudentCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    roll_no: str = Field(..., min_length=3, max_length=20)
    parent_contact: str = Field(..., pattern=r"^\+?1?\d{9,15}$")
    admission_date: date


# For updating student details (optional all fields)
class StudentUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    phone: str | None = Field(None, pattern=r"^\+?1?\d{9,15}$")
    email: str | None = None # We'll handle EmailStr if needed, but services usually handle this
    address: str | None = Field(None, max_length=255)
    roll_no: str | None = Field(None, min_length=3, max_length=20)
    parent_contact: str | None = Field(None, pattern=r"^\+?1?\d{9,15}$")
    admission_date: date | None = None


from app.schemas.users import UserOut
from app.schemas.enrollment import EnrollmentOut
from app.schemas.student_minimal import StudentMinimal

# For returning student details to the API
class StudentOut(BaseModel):
    student_id: int
    user_id: int
    roll_no: str
    parent_contact: str
    admission_date: date
    user: UserOut
    enrollments: List[EnrollmentOut] = []

    class Config:
        from_attributes = True
