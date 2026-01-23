from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone_utils import get_ist_now


class Users(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(50), unique=True)
    phone = Column(String(15))
    role = Column(String(20))
    password = Column(String(255))
    address = Column(String(255))
    created_at = Column(DateTime, default=get_ist_now)


    todos = relationship("Todo", back_populates="owner")
