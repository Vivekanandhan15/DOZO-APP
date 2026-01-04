from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.assignments import AssignmentCreate
from app.services.assignments import create_assignment, delete_assignment
from app.utils.auth import require_role

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def add(data: AssignmentCreate, user=Depends(require_role(["ADMIN"])), db: Session = Depends(get_db)):
    try:
        return create_assignment(db, data, user.user_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


from app.services.students import get_student_by_user
from app.services.enrollment import get_student_batch
from app.services.assignments import get_assignments_by_batch

@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_assignments(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    enrollment = get_student_batch(db, student.student_id)
    if not enrollment:
        return []
        
    return get_assignments_by_batch(db, enrollment.batch_id)
