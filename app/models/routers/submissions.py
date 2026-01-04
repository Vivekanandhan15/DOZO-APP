from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import Base,get_db
from app.utils.auth import require_role, get_current_user
from app.services.submissions import submit_assignment, grade_submission
from app.schemas.submissions import SubmissionCreate, GradeSubmission

router = APIRouter(prefix="/submissions", tags=["Submissions"])

# Student submitting assignment
@router.post("/", dependencies=[Depends(require_role(["STUDENT"]))])
def submit(data: SubmissionCreate, user=Depends(require_role(["STUDENT"])),
           db: Session = Depends(get_db)):
    return submit_assignment(db, user.user_id, data)

# Teacher grading submission
@router.put("/{submission_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def grade_s(submission_id: int, data: GradeSubmission, db: Session = Depends(get_db)):
    return grade_submission(db, submission_id, data)

from app.services.students import get_student_by_user
from app.services.submissions import get_all_submissions, get_student_submissions

@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_submissions(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return get_student_submissions(db, student.student_id)

from typing import List
from app.schemas.submissions import SubmissionOut

@router.get("/all", response_model=List[SubmissionOut], dependencies=[Depends(require_role(["ADMIN"]))])
def all_submissions(user=Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    return get_all_submissions(db)
