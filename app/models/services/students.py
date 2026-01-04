from sqlalchemy.orm import Session, joinedload
from app.models.students import Students
from app.models.enrollment import Enrollment
from app.schemas.students import StudentCreate, StudentUpdate


# ➕ Create student record (Admin only)
def create_student(db: Session, data: StudentCreate):
    # Prevent duplicate student for same user
    existing = db.query(Students).filter(
        Students.user_id == data.user_id
    ).first()

    if existing:
        return None

    student = Students(
        user_id=data.user_id,
        roll_no=data.roll_no,
        parent_contact=data.parent_contact,
        admission_date=data.admission_date
    )

    db.add(student)
    db.commit()
    db.refresh(student)
    return student


# 👤 Get student by USER ID
def get_student_by_user(db: Session, user_id: int):
    return db.query(Students).filter(
        Students.user_id == user_id
    ).first()


# ✏️ Update student details
def update_student(db: Session, student_id: int, data: StudentUpdate):
    student = db.query(Students).filter(
        Students.student_id == student_id
    ).first()

    if not student:
        return None

    for key, value in data.dict(exclude_unset=True).items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)
    return student


# 📋 Get all students (Admin)
def get_all_students(db: Session):
    return db.query(Students).options(
        joinedload(Students.user),
        joinedload(Students.enrollments).joinedload(Enrollment.batch)
    ).all()
