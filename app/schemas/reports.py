from pydantic import BaseModel
from typing import List, Optional

class SubjectGrade(BaseModel):
    name: str
    marks: str

class ReportRequest(BaseModel):
    student_name: str
    attendance: str
    remarks: Optional[str] = "No remarks provided."
    subjects: List[SubjectGrade] = []
