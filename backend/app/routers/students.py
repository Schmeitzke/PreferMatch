from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth
from datetime import timedelta
from jose import jwt, JWTError

router = APIRouter()

def get_current_student(request: Request):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get("student_access_token")
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, auth.settings.SECRET_KEY, algorithms=[auth.settings.ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None or not sub.startswith("student:"):
            raise credentials_exception
        # Format: student:<student_number>:<project_code>
        parts = sub.split(":")
        if len(parts) != 3:
            raise credentials_exception
        return {"student_number": parts[1], "unique_code": parts[2]}
    except JWTError:
        raise credentials_exception

@router.get("/validate/{unique_code}/{student_number}")
def validate_entry(unique_code: str, student_number: str, response: Response, db: Session = Depends(database.get_db)):
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
    
    # Generate Student Token
    access_token_expires = timedelta(minutes=60) # 1 hour session for student
    token_sub = f"student:{student_number}:{unique_code}"
    access_token = auth.create_access_token(
        data={"sub": token_sub}, 
        expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="student_access_token",
        value=access_token,
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=auth.settings.ENVIRONMENT == "production"
    )
    
    return {
        "project_title": project.title,
        "valid": True
    }

@router.get("/options/{unique_code}", response_model=schemas.ProjectResponse)
def get_project_options(unique_code: str, db: Session = Depends(database.get_db), student_auth: dict = Depends(get_current_student)):
    # Verify the token matches the requested code
    if student_auth["unique_code"] != unique_code:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    project = db.query(models.Project).filter(models.Project.unique_code == unique_code).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/submit")
def submit_choices(submission: schemas.StudentSubmission, db: Session = Depends(database.get_db), student_auth: dict = Depends(get_current_student)):
    # Verify token matches submission
    if student_auth["unique_code"] != submission.project_code or student_auth["student_number"] != submission.student_id:
         raise HTTPException(status_code=403, detail="Submission data does not match authenticated session")

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
