from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import books, members, borrow, member_add
from app.db.database import Base, engine

app = FastAPI(title="Library API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(books.router, prefix="/api/v1/books")
app.include_router(members.router, prefix="/api/v1/members")
app.include_router(borrow.router, prefix="/api/v1")
app.include_router(member_add.router, prefix="/api/v1/member_add")
