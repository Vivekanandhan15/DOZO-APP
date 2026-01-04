import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Add the project root to sys.path to import app modules if needed
sys.path.append(str(Path(__file__).resolve().parent.parent))

def verify_connection():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Attempting to connect to: {database_url.split('@')[-1]}") # Hide credentials
    
    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            print("Successfully connected to the database!")
            
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if tables:
                print(f"Found {len(tables)} tables:")
                for table in sorted(tables):
                    print(f" - {table}")
            else:
                print("No tables found in the database yet.")
                
    except Exception as e:
        print(f"Error connecting to the database: {e}")

if __name__ == "__main__":
    verify_connection()
