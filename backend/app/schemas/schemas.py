from pydantic import BaseModel
from typing import Optional

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int

class MemberCreate(BaseModel):
    name: str
    email: str
    phone: str

class BorrowRequest(BaseModel):
    book_id: int
    member_id: int
