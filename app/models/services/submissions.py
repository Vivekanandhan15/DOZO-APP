from datetime import datetime
from sqlalchemy.orm import Session
from app.models.submissions import Submissions

def submit_assignment(db, student_id, data):
    s = Submissions(
        assignment_id=data.assignment_id,
        student_id=student_id,
        file_url=data.file_url,
        submitted_at=datetime.utcnow()
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

def grade_submission(db, submission_id, data):
    submission = db.query(Submissions).filter(Submissions.submission_id == submission_id).first()
    if submission:
        submission.grade = data.grade
        submission.feedback = data.feedback
        db.commit()
        db.refresh(submission)
    return submission

from app.models.assignments import Assignments
from app.models.users import Users

def get_student_submissions(db, student_id):
    # For student view, maybe they also want title? 
    # Let's keep it simple or upgrade this too if needed. 
    # For now, focus on Admin requirement.
    return db.query(Submissions).filter(Submissions.student_id == student_id).all()

def get_all_submissions(db):
    results = db.query(Submissions, Assignments.title, Users.name)\
        .join(Assignments, Submissions.assignment_id == Assignments.assignment_id)\
        .join(Users, Submissions.student_id == Users.user_id)\
        .all()
    
    out = []
    for sub, title, name in results:
        # Create a dict from the SQLAlchemy object
        # We can't modify the object directly safely if it's attached to session in a way that triggers updates
        # But for read, we can construct the Pydantic model response
        # or just attach attributes dynamically if Pydantic 'from_attributes' handles it?
        # Safer to return a dict or object that has these attrs.
        
        # Pydantic from_attributes=True will look for attributes.
        # Let's just set them on the sub object temporarily or create a wrapper.
        sub.assignment_title = title
        sub.student_name = name
        out.append(sub)
        
    return out
