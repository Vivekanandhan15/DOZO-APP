from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database.database import Base


class Batches(Base):
    __tablename__ = "batches"

    batch_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    teacher_id = Column(Integer, ForeignKey("users.user_id"))
    start_date = Column(Date)
    end_date = Column(Date)
    time = Column(String(50)) # e.g. "09:00 - 11:00 AM"
