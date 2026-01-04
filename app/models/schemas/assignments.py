from pydantic import BaseModel
from datetime import date

class AssignmentCreate(BaseModel):
    batch_id: int
    title: str
    description: str
    due_date: date
    points: int

class AssignmentOut(BaseModel):
    assignment_id: int
    batch_id: int
    title: str
    description: str
    due_date: date
    points: int

    class Config:
        from_attributes = True
