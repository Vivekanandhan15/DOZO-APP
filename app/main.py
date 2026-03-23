from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer
import os

from app.database.database import engine, Base
from app.models import (users, students, batches, enrollment,assignments, submissions, attendance,leaves, announcements)

from app.routers.users import router as user_router
from app.routers.students import router as student_router
from app.routers.batches import router as batches_router
from app.routers.enrollment import router as enrollment_router
from app.routers.assignments import router as assignments_router
from app.routers.submissions import router as submissions_router
from app.routers.attendance import router as attendance_router
from app.routers.leaves import router as leaves_router
from app.routers.announcements import router as announcements_router
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.todo import router as todo_router
from app.routers.reports import router as reports_router
from app.routers.teachers import router as teachers_router

# Swagger OAuth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

app = FastAPI(
    title="DOZO",
    docs_url="/docs",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)


#  Protect DB creation in production
if os.getenv("ENV") != "production":
    Base.metadata.create_all(bind=engine)

# Routers
app.include_router(user_router)
app.include_router(student_router)
app.include_router(batches_router)
app.include_router(enrollment_router)
app.include_router(assignments_router)
app.include_router(submissions_router)
app.include_router(attendance_router)
app.include_router(leaves_router)
app.include_router(announcements_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(todo_router)
app.include_router(teachers_router)

from app.routers import teacher_dashboard
app.include_router(teacher_dashboard.router)

from app.routers import student_dashboard
app.include_router(student_dashboard.router)

app.include_router(reports_router)


@app.api_route("/health",methods=["GET","HEAD"])
def health():
    return {"status": "ok"}


# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="static")

# ------------------ Pages ------------------

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/attendance", response_class=HTMLResponse)
def attendance_page(request: Request):
    return templates.TemplateResponse("pages/attendance.html", {"request": request})

@app.get("/attendance/mark", response_class=HTMLResponse)
def attendance_marking_page(request: Request):
    return templates.TemplateResponse("pages/attendance_marking.html", {"request": request})

# -------- Teacher --------

@app.get("/teacher", response_class=HTMLResponse)
def teacher_page(request: Request):
    return templates.TemplateResponse("pages/teacher_dashboard.html", {"request": request})

@app.get("/teacher/students", response_class=HTMLResponse)
def teacher_students_page(request: Request):
    return templates.TemplateResponse("pages/teacher_students.html", {"request": request})

@app.get("/teacher/batches", response_class=HTMLResponse)
def teacher_batches_page(request: Request):
    return templates.TemplateResponse("pages/teacher_batches.html", {"request": request})

@app.get("/teacher/attendance", response_class=HTMLResponse)
def teacher_attendance_page(request: Request):
    return templates.TemplateResponse("pages/teacher_attendance.html", {"request": request})

@app.get("/teacher/attendance/mark", response_class=HTMLResponse)
def teacher_attendance_marking_page(request: Request):
    return templates.TemplateResponse("pages/teacher_attendance_marking.html", {"request": request})

@app.get("/teacher/leaves", response_class=HTMLResponse)
def teacher_leaves_page(request: Request):
    return templates.TemplateResponse("pages/teacher_leaves.html", {"request": request})

@app.get("/teacher/student-leaves", response_class=HTMLResponse)
def teacher_student_leaves_page(request: Request):
    return templates.TemplateResponse("pages/teacher_student_leaves.html", {"request": request})

@app.get("/teacher/reports", response_class=HTMLResponse)
def teacher_reports_page(request: Request):
    return templates.TemplateResponse("pages/teacher_report_generation.html", {"request": request})

@app.get("/teacher/announcements", response_class=HTMLResponse)
def teacher_announcements_page(request: Request):
    return templates.TemplateResponse("pages/teacher_announcements.html", {"request": request})

@app.get("/teacher/tasks", response_class=HTMLResponse)
def teacher_tasks_page(request: Request):
    return templates.TemplateResponse("pages/teacher_tasks.html", {"request": request})

@app.get("/teacher/task-review", response_class=HTMLResponse)
def teacher_task_review_page(request: Request):
    return templates.TemplateResponse("pages/teacher_task_review.html", {"request": request})

@app.get("/teacher/todo", response_class=HTMLResponse)
def teacher_todo_page(request: Request):
    return templates.TemplateResponse("pages/teacher_todo.html", {"request": request})

@app.get("/teacher/change-password", response_class=HTMLResponse)
def teacher_change_password_page(request: Request):
    return templates.TemplateResponse("pages/teacher_change_password.html", {"request": request})

# -------- Admin --------

@app.get("/admin", response_class=HTMLResponse)
def admin_page(request: Request):
    return templates.TemplateResponse("pages/Admin_page.html", {"request": request})

@app.get("/admin/students", response_class=HTMLResponse)
def admin_student_page(request: Request):
    return templates.TemplateResponse("pages/Admin_student_page.html", {"request": request})

@app.get("/admin/students/add", response_class=HTMLResponse)
def add_student_page(request: Request):
    return templates.TemplateResponse("pages/add_student.html", {"request": request})

@app.get("/admin/batches", response_class=HTMLResponse)
def batch_management_page(request: Request):
    return templates.TemplateResponse("pages/batch_management.html", {"request": request})

@app.get("/admin/teachers", response_class=HTMLResponse)
def admin_teachers_page(request: Request):
    return templates.TemplateResponse("pages/admin_teachers.html", {"request": request})

@app.get("/admin/tasks")
def tasks_page():
    return FileResponse("static/pages/taskpage.html")

@app.get("/admin/task-management")
def task_management_page():
    return FileResponse("static/pages/task_management.html")

@app.get("/admin/task-review", response_class=HTMLResponse)
def admin_task_review_page(request: Request):
    return templates.TemplateResponse("pages/task_review.html", {"request": request})

@app.get("/admin/todo", response_class=HTMLResponse)
def admin_todo_page(request: Request):
    return templates.TemplateResponse("pages/todo.html", {"request": request})

@app.get("/admin/announcements", response_class=HTMLResponse)
def admin_announcements_page(request: Request):
    return templates.TemplateResponse("pages/announcements.html", {"request": request})

@app.get("/admin/leave-approval", response_class=HTMLResponse)
def admin_leave_approval_page(request: Request):
    return templates.TemplateResponse("pages/leave_approval.html", {"request": request})

@app.get("/admin/reports", response_class=HTMLResponse)
def admin_reports_page(request: Request):
    return templates.TemplateResponse("pages/report_generation.html", {"request": request})

@app.get("/admin/profile", response_class=HTMLResponse)
def admin_profile_page(request: Request):
    return templates.TemplateResponse("pages/admin_profile.html", {"request": request})

@app.get("/admin/change-password", response_class=HTMLResponse)
def admin_change_password_page(request: Request):
    return templates.TemplateResponse("pages/admin_change_password.html", {"request": request})

@app.get("/admin/staff-management")
def admin_staff_management_page():
    return FileResponse("static/pages/admin_staff_management.html")

# -------- Student --------

@app.get("/student", response_class=HTMLResponse)
def student_dashboard(request: Request):
    return templates.TemplateResponse("pages/student_dashboard.html", {"request": request})

@app.get("/student/tasks", response_class=HTMLResponse)
def student_tasks_page(request: Request):
    return templates.TemplateResponse("pages/student_tasks.html", {"request": request})

@app.get("/student/attendance", response_class=HTMLResponse)
def student_attendance_page(request: Request):
    return templates.TemplateResponse("pages/student_attendance.html", {"request": request})

@app.get("/student/leaves", response_class=HTMLResponse)
def student_leaves_page(request: Request):
    return templates.TemplateResponse("pages/student_leaves.html", {"request": request})

@app.get("/student/announcements", response_class=HTMLResponse)
def student_announcements_page(request: Request):
    return templates.TemplateResponse("pages/student_announcements.html", {"request": request})

@app.get("/student/profile", response_class=HTMLResponse)
def student_profile_page(request: Request):
    return templates.TemplateResponse("pages/student_profile.html", {"request": request})

# -------- System --------

@app.get("/system/setup-initial-admin", response_class=HTMLResponse)
def system_setup_admin_page(request: Request):
    return templates.TemplateResponse("pages/setup_admin.html", {"request": request})
