from pydantic import BaseModel
from app.schemas.batches import BatchOut
from typing import Optional, List
from app.schemas.student_minimal import StudentMinimal

class EnrollStudent(BaseModel):
    student_id: int
    batch_id: int

class EnrollmentOut(BaseModel):
    enroll_id: int
    batch: Optional[BatchOut] = None
    student: Optional[StudentMinimal] = None
    
    class Config:
        from_attributes = True
