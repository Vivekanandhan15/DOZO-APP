from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.services.leaves import apply_leave, update_leave, get_student_leaves, get_all_leaves
from app.schemas.leaves import LeaveApply, LeaveUpdate, LeaveOut

router = APIRouter(prefix="/leaves", tags=["Leaves"])

from app.services.students import get_student_by_user

# ... imports ...

@router.post("/", dependencies=[Depends(require_role(["STUDENT"]))])
def apply(data: LeaveApply, user=Depends(require_role(["STUDENT"])),
          db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    try:
        return apply_leave(db, student.student_id, data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Student view their leave requests
@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_leaves(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return get_student_leaves(db, student.student_id)


# Admin / Teacher approval
@router.put("/{leave_id}", dependencies=[Depends(require_role(["ADMIN"]))])
def approve_or_reject(leave_id: int, data: LeaveUpdate, db: Session = Depends(get_db)):
    res = update_leave(db, leave_id, data)
    if not res:
        raise HTTPException(status_code=404, detail="Leave not found")
    return res


# Admin view all
@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))], response_model=list[LeaveOut])
def view_all(db: Session = Depends(get_db)):
    return get_all_leaves(db)
