from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_member_adds():
    return {"message": "List member adds"}

@router.post("/")
def create_member_add():
    return {"message": "Create member add"}
