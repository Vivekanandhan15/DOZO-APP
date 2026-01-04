from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from datetime import datetime
from app.database.database import Base


class Announcements(Base):
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150))
    content = Column(Text)
    batch_id = Column(Integer, nullable=True)  # None = for ALL
    expiry_date = Column(Date)
    created_by = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
