from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Enrollment(Base):
    __tablename__ = "enrollment"

    enroll_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    batch_id = Column(Integer, ForeignKey("batches.batch_id"))

    student = relationship("Students", back_populates="enrollments")
    batch = relationship("Batches")
