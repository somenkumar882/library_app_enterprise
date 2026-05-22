from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Member
from app.schemas.schemas import MemberCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/")
def list_members(db: Session = Depends(get_db)):
    return db.query(Member).all()

@router.post("/member_add")
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    try:
        new_member = Member(
            name=member.name,
            email=member.email,
            phone=member.phone
        )
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        return new_member
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
