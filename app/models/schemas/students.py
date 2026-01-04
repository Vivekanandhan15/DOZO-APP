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
    roll_no: str | None = None
    parent_contact: str | None = None
    admission_date: date | None = None


from app.schemas.users import UserOut

# For returning student details to the API
class StudentOut(BaseModel):
    student_id: int
    user_id: int
    roll_no: str
    parent_contact: str
    admission_date: date
    user: UserOut

    class Config:
        from_attributes = True
