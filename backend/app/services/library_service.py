from sqlalchemy.orm import Session
from app.models.models import Book, BorrowRecord
from datetime import datetime

def borrow_book(db: Session, book_id: int, member_id: int):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book or book.available_copies <= 0:
        raise Exception("Book not available")

    record = BorrowRecord(
        book_id=book_id,
        member_id=member_id,
        status="borrowed"
    )

    book.available_copies -= 1
    db.add(record)
    db.commit()
    return record

def return_book(db: Session, record_id: int):
    record = db.query(BorrowRecord).filter(BorrowRecord.id == record_id).first()
    if not record or record.status == "returned":
        raise Exception("Invalid return")

    record.status = "returned"
    record.return_date = datetime.utcnow()

    book = db.query(Book).filter(Book.id == record.book_id).first()
    book.available_copies += 1

    db.commit()
    return record
