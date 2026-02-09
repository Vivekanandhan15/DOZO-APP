import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the root directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.utils.hashing import hash_password

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def seed_demo_users():
    demo_users = [
        {
            "name": "Admin Demo",
            "email": "admin_demo@dozo.com",
            "role": "ADMIN",
            "password": "demo123",
            "phone": "0000000000",
            "address": "Demo Office"
        },
        {
            "name": "Teacher Demo",
            "email": "teacher_demo@dozo.com",
            "role": "TEACHER",
            "password": "demo123",
            "phone": "0000000000",
            "address": "Demo Classroom"
        },
        {
            "name": "Student Demo",
            "email": "student_demo@dozo.com",
            "role": "STUDENT",
            "password": "demo123",
            "phone": "0000000000",
            "address": "Demo Hostel"
        }
    ]

    try:
        with engine.connect() as connection:
            trans = connection.begin()
            try:
                for user_data in demo_users:
                    # Check if user already exists
                    check_query = text("SELECT EXISTS(SELECT 1 FROM users WHERE email = :email)")
                    exists = connection.execute(check_query, {"email": user_data["email"]}).scalar()
                    
                    if not exists:
                        print(f"Creating demo user: {user_data['email']} ({user_data['role']})")
                        hashed_pw = hash_password(user_data["password"])
                        insert_query = text("""
                            INSERT INTO users (name, email, role, password, phone, address, created_at)
                            VALUES (:name, :email, :role, :password, :phone, :address, NOW())
                        """)
                        connection.execute(insert_query, {
                            "name": user_data["name"],
                            "email": user_data["email"],
                            "role": user_data["role"],
                            "password": hashed_pw,
                            "phone": user_data["phone"],
                            "address": user_data["address"]
                        })
                    else:
                        print(f"Demo user already exists: {user_data['email']}")
                
                trans.commit()
                print("Demo users seeded successfully!")
            except Exception as e:
                trans.rollback()
                raise e
    except Exception as e:
        print(f"Error seeding demo users: {e}")

if __name__ == "__main__":
    seed_demo_users()
