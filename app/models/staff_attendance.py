from sqlalchemy import Column, Integer, Date, ForeignKey, String, DateTime
from datetime import datetime
from app.database.database import Base
from sqlalchemy.orm import relationship

class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    attendance_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    status = Column(String(10))  # PRESENT / ABSENT
    date = Column(Date)
    marked_by = Column(Integer, ForeignKey("users.user_id")) # Admin ID
    marked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("Users", foreign_keys=[user_id])
    admin = relationship("Users", foreign_keys=[marked_by])
