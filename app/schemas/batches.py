from pydantic import BaseModel
from datetime import date

class BatchCreate(BaseModel):
    name: str
    teacher_id: int
    start_date: date
    end_date: date

class BatchOut(BaseModel):
    batch_id: int
    name: str
    class Config:
        from_attributes = True
