from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class Assignments(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer)
    teacher_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String(150))
    description = Column(Text)
    due_date = Column(Date)
    points = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Users")
