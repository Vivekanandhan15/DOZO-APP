from pydantic import BaseModel

class EnrollStudent(BaseModel):
    student_id: int
    batch_id: int

from app.schemas.students import StudentOut

class EnrollmentOut(BaseModel):
    enroll_id: int
    student: StudentOut
    class Config:
        from_attributes = True
