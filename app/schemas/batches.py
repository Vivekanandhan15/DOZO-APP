from pydantic import BaseModel, Field
from datetime import date

class BatchCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    teacher_id: int = Field(..., gt=0)
    start_date: date
    end_date: date

class BatchOut(BaseModel):
    batch_id: int
    name: str
    class Config:
        from_attributes = True
