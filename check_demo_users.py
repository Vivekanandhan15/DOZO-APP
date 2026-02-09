import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    result = connection.execute(text("SELECT email, role FROM users WHERE email LIKE '%demo%';"))
    rows = result.fetchall()
    if not rows:
        print("No demo users found.")
    else:
        for row in rows:
            print(f"Email: {row[0]}, Role: {row[1]}")
