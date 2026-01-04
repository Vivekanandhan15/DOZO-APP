from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    priority = Column(String, default="Medium")  # High, Medium, Low
    status = Column(String, default="Pending")  # Pending, Completed
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Key to User
    user_id = Column(Integer, ForeignKey("users.user_id"))
    
    owner = relationship("Users", back_populates="todos")
