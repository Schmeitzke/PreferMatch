from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas, database, auth, algorithm
import uuid
import pandas as pd
from io import BytesIO
import json
from typing import List

router = APIRouter()

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    unique_code = str(uuid.uuid4())[:8]
    
    db_project = models.Project(
        title=project.title,
        unique_code=unique_code,
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    for opt in project.options:
        db_option = models.Option(
            project_id=db_project.id,
            title=opt.title,
            description=opt.description,
            requirements=opt.requirements,
            supervisors=opt.supervisors,
            capacity=opt.capacity
        )
        db.add(db_option)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[schemas.ProjectListResponse])
def get_projects(db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    projects = db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    
    result = []
    for project in projects:
        submission_count = db.query(models.Student).filter(models.Student.project_id == project.id).count()
        total_capacity = db.query(func.sum(models.Option.capacity)).filter(models.Option.project_id == project.id).scalar() or 0
        
        result.append({
            "id": project.id,
            "title": project.title,
            "unique_code": project.unique_code,
            "is_active": project.is_active,
            "is_closed": project.is_closed,
            "archived": project.archived,
            "options": project.options,
            "submission_count": submission_count,
            "total_capacity": total_capacity
        })
    
    return result

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.submission_count = db.query(models.Student).filter(models.Student.project_id == project.id).count()
    return project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_data: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    submission_count = db.query(models.Student).filter(models.Student.project_id == project_id).count()
    if submission_count > 0:
        raise HTTPException(status_code=400, detail="Cannot edit project with existing submissions")
    
    project.title = project_data.title
    
    db.query(models.Option).filter(models.Option.project_id == project_id).delete()
    
    for opt in project_data.options:
        db_option = models.Option(
            project_id=project_id,
            title=opt.title,
            description=opt.description,
            requirements=opt.requirements,
            supervisors=opt.supervisors,
            capacity=opt.capacity
        )
        db.add(db_option)
    
    db.commit()
    db.commit()
    db.refresh(project)
    project.submission_count = 0
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return {"status": "deleted"}

@router.put("/{project_id}/finalise")
def finalise_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_active = True
    db.commit()
    return {"status": "success"}

@router.put("/{project_id}/close")
def close_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_closed = True
    db.commit()
    return {"status": "success"}

@router.post("/{project_id}/calculate")
def calculate_results(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    students = db.query(models.Student).filter(models.Student.project_id == project_id).all()
    
    student_data = []
    for s in students:
        prefs = {}
        for p in s.preferences:
            prefs[p.option_id] = p.rank
        student_data.append({"id": s.id, "preferences": prefs})
        
    options = [{"id": o.id, "capacity": o.capacity} for o in project.options]
    
    assignments = algorithm.solve_assignment(student_data, options)
    
    for s in students:
        if s.id in assignments:
            s.assigned_option_id = assignments[s.id]
            
    db.commit()
    return {"status": "calculated"}

@router.get("/{project_id}/results", response_model=List[schemas.AssignmentResult])
def get_results(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    results = []
    students = db.query(models.Student).filter(models.Student.project_id == project_id).all()
    
    options_map = {o.id: o.title for o in project.options}
    
    for s in students:
        if s.assigned_option_id:
            results.append({
                "student_number": s.student_number,
                "assigned_option_title": options_map.get(s.assigned_option_id, "Unknown"),
                "assigned_option_id": s.assigned_option_id
            })
            
@router.get("/{project_id}/students", response_model=List[schemas.StudentDetail])
def get_students(project_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    students = db.query(models.Student).filter(models.Student.project_id == project_id).all()
    return students

@router.put("/{project_id}/students/{student_id}")
def update_student(project_id: int, student_id: int, update_data: schemas.StudentUpdate, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.project_id == project_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if update_data.student_number:
        # Check uniqueness
        exists = db.query(models.Student).filter(
            models.Student.project_id == project_id, 
            models.Student.student_number == update_data.student_number,
            models.Student.id != student_id
        ).first()
        if exists:
            raise HTTPException(status_code=409, detail="Student number already exists")
        student.student_number = update_data.student_number
    
    if update_data.preferences:
        # Remove old prefs
        db.query(models.Preference).filter(models.Preference.student_id == student_id).delete()
        # Add new prefs
        for pref in update_data.preferences:
            db_pref = models.Preference(
                student_id=student.id,
                option_id=pref.option_id,
                rank=pref.rank
            )
            db.add(db_pref)
            
    db.commit()
    return {"status": "updated"}

@router.delete("/{project_id}/students/{student_id}")
def delete_student(project_id: int, student_id: int, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    student = db.query(models.Student).filter(models.Student.id == student_id, models.Student.project_id == project_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    return {"status": "deleted"}

@router.get("/{project_id}/export")
def export_results(project_id: int, format: str = "json", db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    results = []
    students = db.query(models.Student).filter(models.Student.project_id == project_id).all()
    options_map = {o.id: o.title for o in project.options}
    
    for s in students:
        assigned_option = options_map.get(s.assigned_option_id, "Unassigned")
        results.append({
            "Student ID": s.student_number,
            "Assigned Project": assigned_option
        })
    
    if format == "json":
        return results
    elif format == "txt":
        content = "Student ID\tAssigned Project\n"
        for r in results:
            content += f"{r['Student ID']}\t{r['Assigned Project']}\n"
        return StreamingResponse(
            BytesIO(content.encode()),
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=results_{project_id}.txt"}
        )
    elif format == "excel":
        df = pd.DataFrame(results)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Results')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=results_{project_id}.xlsx"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format")
