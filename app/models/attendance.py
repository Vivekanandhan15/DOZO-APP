from sqlalchemy import Column, Integer, Date, ForeignKey, String, DateTime
from datetime import datetime
from app.database.database import Base


class Attendance(Base):
    __tablename__ = "attendance_records"

    attendance_id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.batch_id"))
    student_id = Column(Integer, ForeignKey("students.student_id"))
    status = Column(String(10))  # PRESENT / ABSENT
    date = Column(Date)
    marked_by = Column(Integer, ForeignKey("users.user_id"))
    marked_at = Column(DateTime, default=datetime.utcnow)
