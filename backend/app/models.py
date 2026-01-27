from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    sirname = Column(String)
    department = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    unique_code = Column(String, unique=True, index=True) # The code shared with students
    title = Column(String)
    is_active = Column(Boolean, default=False) # "finalised"
    is_closed = Column(Boolean, default=False) # "closed" for submissions
    archived = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("admins.id"))

    owner = relationship("Admin", back_populates="projects")
    options = relationship("Option", back_populates="project", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="project", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String)
    description = Column(Text)
    requirements = Column(Text, nullable=True)
    supervisors = Column(String, nullable=True)
    capacity = Column(Integer, default=50)
    
    project = relationship("Project", back_populates="options")
    # preferences = relationship("Preference", back_populates="option")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    student_number = Column(String) # The 'i'+number
    
    project = relationship("Project", back_populates="students")
    preferences = relationship("Preference", back_populates="student", cascade="all, delete-orphan")
    assigned_option_id = Column(Integer, ForeignKey("options.id"), nullable=True)

class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    option_id = Column(Integer, ForeignKey("options.id"))
    rank = Column(Integer) # 1 is highest preference

    student = relationship("Student", back_populates="preferences")
    # option = relationship("Option", back_populates="preferences")
