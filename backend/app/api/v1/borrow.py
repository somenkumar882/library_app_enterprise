from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import BorrowRecord
from app.schemas.schemas import BorrowRequest
from app.services.library_service import borrow_book, return_book

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/borrow")
def list_all_borrows(db: Session = Depends(get_db)):
    return db.query(BorrowRecord).all()

@router.get("/members/{member_id}/borrowed")
def get_member_borrows(member_id: int, db: Session = Depends(get_db)):
    return db.query(BorrowRecord).filter(BorrowRecord.member_id == member_id).all()

@router.post("/borrow")
def borrow(data: BorrowRequest, db: Session = Depends(get_db)):
    try:
        return borrow_book(db, data.book_id, data.member_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/return")
def return_book_api(data: dict, db: Session = Depends(get_db)):
    try:
        return return_book(db, data["record_id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
