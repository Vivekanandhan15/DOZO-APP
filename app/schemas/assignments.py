from pydantic import BaseModel, Field
from datetime import date

class AssignmentCreate(BaseModel):
    batch_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=1000)
    due_date: date
    points: int = Field(100, ge=0)

class AssignmentOut(BaseModel):
    assignment_id: int
    batch_id: int
    teacher_id: int | None = None
    title: str
    description: str
    due_date: date
    points: int
    teacher_name: str = "Admin"

    class Config:
        from_attributes = True
