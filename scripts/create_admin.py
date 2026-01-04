import os
import sys
from pathlib import Path
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database.database import SessionLocal, engine
from app.models.users import Users
from app.models.todo import Todo # Import Todo as it's a relationship in Users
from app.utils.hashing import hash_password

def create_admin():
    # Load env vars
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_email = "admin@dozo.com"
        existing_admin = db.query(Users).filter(Users.email == admin_email).first()
        
        if existing_admin:
            print(f"Admin with email {admin_email} already exists.")
            return

        # Create new admin
        new_admin = Users(
            name="Admin User",
            email=admin_email,
            phone="1234567890",
            role="Admin",
            password=hash_password("admin123"), # Default password
            address="System HQ",
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        print(f"Admin user created successfully!")
        print(f"Email: {new_admin.email}")
        print(f"Role: {new_admin.role}")
        print(f"Initial Password: admin123")
        print("\nIMPORTANT: Please change this password after your first login.")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
