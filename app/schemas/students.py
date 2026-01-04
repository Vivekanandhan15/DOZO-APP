from pydantic import BaseModel
from datetime import date


# For creating a student entry in DB
class StudentCreate(BaseModel):
    user_id: int
    roll_no: str
    parent_contact: str
    admission_date: date


# For updating student details (optional all fields)
class StudentUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    roll_no: str | None = None
    parent_contact: str | None = None
    admission_date: date | None = None


from app.schemas.users import UserOut
from app.schemas.enrollment import EnrollmentOut
from app.schemas.student_minimal import StudentMinimal
from typing import List

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
