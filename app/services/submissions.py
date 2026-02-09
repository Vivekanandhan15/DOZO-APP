from sqlalchemy.orm import Session
from app.models.submissions import Submissions
from app.utils.timezone_utils import get_ist_now

def submit_assignment(db, student_id, data):
    s = Submissions(
        assignment_id=data.assignment_id,
        student_id=student_id,
        file_url=data.file_url,
        submitted_at=get_ist_now()
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
    return db.query(Submissions).filter(Submissions.student_id == student_id).all()

from app.models.students import Students
from app.models.batches import Batches
from datetime import timedelta

def get_teacher_submissions(db, teacher_id):
    results = db.query(Submissions, Assignments.title, Users.name, Batches.name)\
        .join(Assignments, Submissions.assignment_id == Assignments.assignment_id)\
        .join(Batches, Assignments.batch_id == Batches.batch_id)\
        .join(Students, Submissions.student_id == Students.student_id)\
        .join(Users, Students.user_id == Users.user_id)\
        .filter(Assignments.teacher_id == teacher_id)\
        .all()
    
    out = []
    for sub, title, name, batch_name in results:
        sub.assignment_title = title
        sub.student_name = name
        sub.batch_name = batch_name
        out.append(sub)
    return out

def get_all_submissions(db):
    results = db.query(Submissions, Assignments.title, Users.name, Batches.name)\
        .join(Assignments, Submissions.assignment_id == Assignments.assignment_id)\
        .join(Batches, Assignments.batch_id == Batches.batch_id)\
        .join(Students, Submissions.student_id == Students.student_id)\
        .join(Users, Students.user_id == Users.user_id)\
        .all()
    
    out = []
    for sub, title, name, batch_name in results:
        sub.assignment_title = title
        sub.student_name = name
        sub.batch_name = batch_name
        out.append(sub)
        
    return out
