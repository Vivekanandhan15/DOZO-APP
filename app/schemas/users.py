from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    password: str
    address: str | None = ""

class UserOut(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    phone: str | None = ""
    address: str | None = ""

class PasswordUpdate(BaseModel):
    new_password: str

    class Config:
        from_attributes = True
