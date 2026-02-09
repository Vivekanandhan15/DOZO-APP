import os
import sys

# Add the root directory to sys.path
sys.path.append(os.getcwd())

from app.database.database import engine, Base
from app.models import (users, students, batches, enrollment, assignments, submissions, attendance, leaves, announcements)

def create_tables():
    print("Creating tables in the database...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables()
