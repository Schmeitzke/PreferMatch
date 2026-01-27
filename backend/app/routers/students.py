from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter()

@router.get("/validate/{unique_code}/{student_number}")
def validate_entry(unique_code: str, student_number: str, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.unique_code == unique_code).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.is_active:
        raise HTTPException(status_code=400, detail="Project is not active")
        
    if project.is_closed:
        raise HTTPException(status_code=400, detail="Project is closed")
    
    existing_student = db.query(models.Student).filter(
        models.Student.student_number == student_number,
        models.Student.project_id == project.id
    ).first()
    
    if existing_student:
        raise HTTPException(status_code=409, detail="This student ID has already submitted preferences for this project")
    
    return {
        "project_title": project.title,
        "valid": True
    }

@router.get("/options/{unique_code}", response_model=schemas.ProjectResponse)
def get_project_options(unique_code: str, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.unique_code == unique_code).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/submit")
def submit_choices(submission: schemas.StudentSubmission, db: Session = Depends(database.get_db)):
    project = db.query(models.Project).filter(models.Project.unique_code == submission.project_code).first()
    if not project or not project.is_active or project.is_closed:
        raise HTTPException(status_code=400, detail="Invalid project state")
    
    existing_student = db.query(models.Student).filter(
        models.Student.student_number == submission.student_id,
        models.Student.project_id == project.id
    ).first()
    
    if existing_student:
        raise HTTPException(status_code=409, detail="This student ID has already submitted preferences for this project")
    
    student = models.Student(
        project_id=project.id,
        student_number=submission.student_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)
        
    for pref in submission.preferences:
        db_pref = models.Preference(
            student_id=student.id,
            option_id=pref.option_id,
            rank=pref.rank
        )
        db.add(db_pref)
        
    db.commit()
    return {"status": "success"}
