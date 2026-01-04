from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.batches import BatchCreate
from app.services.batches import create_batch, delete_batch, get_all_batches, update_batch
from app.utils.auth import require_role

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("/", dependencies=[Depends(require_role(["ADMIN"]))])
def list_batches(db: Session = Depends(get_db)):
    return get_all_batches(db)

@router.post("/", dependencies=[Depends(require_role(["ADMIN"]))])
def add(data: BatchCreate, db: Session = Depends(get_db)):
    return create_batch(db, data)

@router.put("/{id}", dependencies=[Depends(require_role(["ADMIN"]))])
def update(id: int, data: BatchCreate, db: Session = Depends(get_db)):
    batch = update_batch(db, id, data)
    if not batch:
        raise HTTPException(404, "Batch not found")
    return batch

@router.delete("/{id}", dependencies=[Depends(require_role(["ADMIN"]))])
def remove(id: int, db: Session = Depends(get_db)):
    if not delete_batch(db, id):
        raise HTTPException(400, "Batch has students")
    return {"msg": "Deleted"}
