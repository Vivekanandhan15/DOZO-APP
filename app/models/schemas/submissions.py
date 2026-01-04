from pydantic import BaseModel

class SubmissionCreate(BaseModel):
    assignment_id: int
    file_url: str

class GradeSubmission(BaseModel):
    grade: int
    feedback: str

from datetime import datetime
from typing import Optional

class SubmissionOut(BaseModel):
    submission_id: int
    assignment_id: int
    student_id: int
    file_url: str
    submitted_at: datetime
    grade: Optional[int] = None
    feedback: Optional[str] = None
    student_name: Optional[str] = None
    assignment_title: Optional[str] = None

    class Config:
        from_attributes = True
