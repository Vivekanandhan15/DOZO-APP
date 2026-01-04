from pydantic import BaseModel
from app.schemas.users import UserOut

class StudentMinimal(BaseModel):
    student_id: int
    roll_no: str
    user: UserOut
    
    class Config:
        from_attributes = True
