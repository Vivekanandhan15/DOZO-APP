from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    password: str

class UserOut(BaseModel):
    user_id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
