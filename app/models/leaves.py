from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone_utils import get_ist_now


class Leaves(Base):
    __tablename__ = "leave_requests"

    leave_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reason = Column(String(255))
    date = Column(Date)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    requested_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, onupdate=get_ist_now)

    
    # Relationships
    student = relationship("Students")
    teacher = relationship("Users")
