from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database.database import get_db
from app.utils.auth import require_role, get_current_user
from app.services.leaves import apply_leave, update_leave, get_student_leaves, get_all_leaves
from app.schemas.leaves import LeaveApply, LeaveUpdate, LeaveOut

router = APIRouter(prefix="/leaves", tags=["Leaves"])

from app.services.students import get_student_by_user

from app.models.users import Users
from app.models.leaves import Leaves
from app.models.students import Students

# ... imports ...

from datetime import date

@router.post("/", dependencies=[Depends(require_role(["STUDENT"]))])
def apply(data: LeaveApply, user=Depends(require_role(["STUDENT"])),
          db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Restriction: Upcoming days only
    if data.date < date.today():
        raise HTTPException(status_code=400, detail="Cannot apply for past dates.")
        
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
@router.put("/{leave_id}", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def approve_or_reject(leave_id: int, data: LeaveUpdate, 
                      user: Users = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    # Custom logic instead of generic update_leave
    leave = db.query(Leaves).filter(Leaves.leave_id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    new_status = data.status.upper() # APPROVED or REJECTED

    user_role = user.role.upper()
    
    if user_role == "TEACHER":
        # Restriction: Upcoming days only
        if leave.date < date.today():
            raise HTTPException(status_code=400, detail="Cannot approve/reject past leaves.")

        if new_status in ["APPROVED", "REJECTED"]:
            # If it's a student leave, teacher has final authority now
            # If it's a teacher's own leave (unlikely to hit this here but for safety), logic might differ
            leave.status = new_status
        else:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    elif user_role == "ADMIN":
        # Admin handles staff/teacher leaves (student_id is NULL)
        if new_status in ["APPROVED", "REJECTED"]:
            leave.status = new_status
        else:
             raise HTTPException(status_code=400, detail="Invalid status")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role for this action")

    db.commit()
    db.refresh(leave)
    return leave

# Helper endpoints for simple button clicks (PUT /leaves/{id}/approve)
@router.put("/{leave_id}/approve", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def approve_leave(leave_id: int, user: Users = Depends(get_current_user), db: Session = Depends(get_db)):
    return approve_or_reject(leave_id, LeaveUpdate(status="APPROVED"), user, db)

@router.put("/{leave_id}/reject", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def reject_leave(leave_id: int, user: Users = Depends(get_current_user), db: Session = Depends(get_db)):
    return approve_or_reject(leave_id, LeaveUpdate(status="REJECTED"), user, db)


# Admin view all - Filtered to STAFF/TEACHER leaves only
@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))], response_model=list[LeaveOut])
def view_all(db: Session = Depends(get_db)):
    # Admin only sees leaves where student_id is NULL (Teacher/Staff leaves)
    return db.query(Leaves).options(
        joinedload(Leaves.student).joinedload(Students.user)
    ).filter(Leaves.student_id == None).all()
