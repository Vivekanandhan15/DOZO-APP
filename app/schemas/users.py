from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?1?\d{9,15}$")
    role: UserRole
    password: str = Field(..., min_length=8)
    address: str | None = Field("", max_length=255)

class UserOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None = ""
    address: str | None = ""

    class Config:
        from_attributes = True

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    class Config:
        from_attributes = True
