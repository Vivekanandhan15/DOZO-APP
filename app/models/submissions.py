from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database.database import Base
from app.utils.timezone_utils import get_ist_now


class Submissions(Base):
    __tablename__ = "submissions"

    submission_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id"))
    student_id = Column(Integer, ForeignKey("students.student_id"))
    file_url = Column(String(255))
    submitted_at = Column(DateTime, default=get_ist_now)

    grade = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
