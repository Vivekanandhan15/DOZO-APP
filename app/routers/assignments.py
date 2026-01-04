from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.assignments import AssignmentCreate, AssignmentOut
from app.services.assignments import create_assignment, delete_assignment
from app.utils.auth import require_role, get_current_user
from app.models.assignments import Assignments
from app.models.users import Users

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def add(data: AssignmentCreate, user=Depends(require_role(["ADMIN", "TEACHER"])), db: Session = Depends(get_db)):
    try:
        return create_assignment(db, data, user.user_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


from app.services.students import get_student_by_user
from app.services.enrollment import get_student_batch
from app.services.assignments import get_assignments_by_batch
from typing import List

@router.get("/me", dependencies=[Depends(require_role(["STUDENT"]))])
def my_assignments(user=Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    student = get_student_by_user(db, user.user_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    enrollment = get_student_batch(db, student.student_id)
    if not enrollment:
        return []
        
    return get_assignments_by_batch(db, enrollment.batch_id)

@router.get("/batch/{batch_id}", response_model=List[AssignmentOut], dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def get_batch_assignments(batch_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    assignments = db.query(Assignments).options(joinedload(Assignments.teacher)).filter(Assignments.batch_id == batch_id).all()
    
    result = []
    for a in assignments:
        result.append({
            "assignment_id": a.assignment_id,
            "batch_id": a.batch_id,
            "teacher_id": a.teacher_id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "points": a.points,
            "teacher_name": a.teacher.name if a.teacher else "Admin"
        })
    return result

# Get single assignment by ID
@router.get("/{assignment_id}", response_model=AssignmentOut, dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignments).filter(Assignments.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

# Update assignment
@router.put("/{assignment_id}", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def update_assignment(assignment_id: int, data: AssignmentCreate, 
                      user: Users = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    assignment = db.query(Assignments).filter(Assignments.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Ownership Check: Only creator or Admin
    if user.role.upper() != "ADMIN" and assignment.teacher_id != user.user_id:
        raise HTTPException(status_code=403, detail="You can only modify tasks you created.")
    
    # Check if there are submissions - if so, don't allow update
    from app.models.submissions import Submissions
    has_submissions = db.query(Submissions).filter(Submissions.assignment_id == assignment_id).first()
    if has_submissions:
        raise HTTPException(status_code=400, detail="Cannot update assignment with existing submissions")
    
    # Update fields
    assignment.title = data.title
    assignment.description = data.description
    assignment.batch_id = data.batch_id
    assignment.due_date = data.due_date
    assignment.points = data.points
    
    db.commit()
    db.refresh(assignment)
    return assignment

# Delete assignment
@router.delete("/{assignment_id}", dependencies=[Depends(require_role(["ADMIN", "TEACHER"]))])
def delete_assignment_route(assignment_id: int, 
                            user: Users = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    from app.models.submissions import Submissions
    
    # Check if assignment exists
    assignment = db.query(Assignments).filter(Assignments.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Ownership Check: Only creator or Admin
    if user.role.upper() != "ADMIN" and assignment.teacher_id != user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete tasks you created.")
    
    # Store assignment title before deletion
    assignment_title = assignment.title
    
    # Count submissions before deleting
    submission_query = db.query(Submissions).filter(Submissions.assignment_id == assignment_id)
    submission_count = submission_query.count()
    
    # Delete all submissions directly
    submission_query.delete(synchronize_session=False)
    db.flush()  # Ensure submissions are deleted before deleting the assignment
    
    # Delete the assignment
    db.delete(assignment)
    db.commit()
    
    return {
        "message": "Assignment deleted successfully",
        "deleted_submissions": submission_count,
        "assignment_title": assignment_title
    }


