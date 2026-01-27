from pydantic import BaseModel, EmailStr
from typing import List, Optional

class AdminBase(BaseModel):
    name: str
    sirname: str
    department: str
    email: EmailStr

class AdminCreate(AdminBase):
    password: str
    register_code: str

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    sirname: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class AdminResponse(AdminBase):
    id: int
    class Config:
        from_attributes = True

class OptionBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    supervisors: Optional[str] = None
    capacity: int = 50

class OptionCreate(OptionBase):
    pass

class OptionResponse(OptionBase):
    id: int
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str

class ProjectCreate(ProjectBase):
    options: List[OptionCreate]

class ProjectResponse(ProjectBase):
    id: int
    unique_code: str
    is_active: bool
    is_closed: bool
    archived: bool
    options: List[OptionResponse]
    submission_count: int = 0
    class Config:
        from_attributes = True

class ProjectListResponse(ProjectResponse):
    submission_count: int
    total_capacity: int

class AdminToken(BaseModel):
    access_token: str
    token_type: str

class StudentLogin(BaseModel):
    project_code: str
    student_number: str

class PreferenceItem(BaseModel):
    option_id: int
    rank: int

class StudentSubmission(BaseModel):
    project_code: str
    student_id: str
    preferences: List[PreferenceItem]

class AssignmentResult(BaseModel):
    student_number: str
    assigned_option_title: str
    assigned_option_id: int
