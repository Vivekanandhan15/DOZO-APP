from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone_utils import get_ist_now


class Assignments(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer)
    teacher_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String(150))
    description = Column(Text)
    due_date = Column(Date)
    points = Column(Integer)
    created_at = Column(DateTime, default=get_ist_now)


    teacher = relationship("Users")
