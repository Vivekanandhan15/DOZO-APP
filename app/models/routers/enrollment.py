from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.services.enrollment import enroll_student, get_students_in_batch, get_student_batch
from app.schemas.enrollment import EnrollStudent, EnrollmentOut

router = APIRouter(prefix="/enrollment", tags=["Enrollment"])


from app.services.students import get_student_by_user

# ... imports ...


# Admin enroll student to batch
@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def enroll(data: EnrollStudent, db: Session = Depends(get_db)):
    res = enroll_student(db, data)
    if not res:
        raise HTTPException(status_code=400, detail="Student already enrolled")
    return res


# Teacher view students enrolled in their batch
@router.get("/batch/{batch_id}", dependencies=[Depends(require_role(["ADMIN"]))], response_model=list[EnrollmentOut])
def batch_students(batch_id: int, db: Session = Depends(get_db)):
    return get_students_in_batch(db, batch_id)


# Student view their batch
@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_batch(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return get_student_batch(db, student.student_id)
