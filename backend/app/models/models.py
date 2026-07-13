from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, CheckConstraint
from app.db.database import Base
from datetime import datetime

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    author = Column(String)
    isbn = Column(String, unique=True)
    total_copies = Column(Integer)
    available_copies = Column(Integer)

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String(10), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "email LIKE '%@gmail.com'",
            name="ck_email_gmail"
        ),
        CheckConstraint(
            "LENGTH(phone) = 10 AND phone GLOB '[0-9]*'",
            name="ck_phone_10_digits"
        ),
    )

class MemberAdd(Base):
    __tablename__ = "member_add"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    added_date = Column(DateTime, default=datetime.utcnow)

class BorrowRecord(Base):
    __tablename__ = "borrow_records"
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    borrow_date = Column(DateTime, default=datetime.utcnow)
    return_date = Column(DateTime)
    status = Column(String)
