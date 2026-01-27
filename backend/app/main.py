from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import admin, projects, students
from .database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Group Assignment API")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(students.router, prefix="/api/students", tags=["students"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Group Assignment API"}
