from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models.todo import Todo
from app.models.users import Users
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/todos",
    tags=["Todos"]
)

@router.post("/", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    new_todo = Todo(**todo.model_dump(), user_id=current_user.user_id)
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.get("/", response_model=List[TodoResponse])
def get_todos(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    query = db.query(Todo).filter(Todo.user_id == current_user.user_id)
    
    from sqlalchemy import case
    
    # Custom sort by priority (High > Medium > Low)
    priority_order = case(
        {
            "High": 1,
            "Medium": 2,
            "Low": 3
        },
        value=Todo.priority,
        else_=4
    )
    
    return query.order_by(priority_order, Todo.due_date.asc()).offset(skip).limit(limit).all()

@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.user_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.user_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    
    db.commit()
    db.refresh(todo)
    return todo

@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == current_user.user_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}
