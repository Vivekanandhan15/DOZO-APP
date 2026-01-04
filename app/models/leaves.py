from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class Leaves(Base):
    __tablename__ = "leave_requests"

    leave_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reason = Column(String(255))
    date = Column(Date)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    requested_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Students")
    teacher = relationship("Users")
