from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Book
from app.schemas.schemas import BookCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/")
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).all()

@router.post("/")
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    try:
        new_book = Book(
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            total_copies=book.total_copies,
            available_copies=book.total_copies
        )
        db.add(new_book)
        db.commit()
        db.refresh(new_book)
        return new_book
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
