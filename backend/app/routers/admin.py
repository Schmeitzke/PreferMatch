from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/register", response_model=schemas.AdminResponse)
def register(admin: schemas.AdminCreate, db: Session = Depends(database.get_db)):
    if admin.register_code != auth.settings.REGISTER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid register code")
    
    user = db.query(models.Admin).filter(models.Admin.email == admin.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(admin.password)
    new_admin = models.Admin(
        name=admin.name,
        sirname=admin.sirname,
        department=admin.department,
        email=admin.email,
        hashed_password=hashed_pwd
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.post("/login", response_model=schemas.AdminToken)
def login_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.Admin).filter(models.Admin.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=auth.settings.ENVIRONMENT == "production"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.AdminResponse)
def read_users_me(current_user: models.Admin = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.AdminResponse)
def update_profile(profile: schemas.AdminUpdate, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    if profile.email and profile.email != current_user.email:
        existing = db.query(models.Admin).filter(models.Admin.email == profile.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
        current_user.email = profile.email
    
    if profile.name is not None:
        current_user.name = profile.name
    if profile.sirname is not None:
        current_user.sirname = profile.sirname
    if profile.department is not None:
        current_user.department = profile.department
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(password_data: schemas.PasswordChange, db: Session = Depends(database.get_db), current_user: models.Admin = Depends(auth.get_current_user)):
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}

@router.post("/refresh", response_model=schemas.AdminToken)
def refresh_token(response: Response, current_user: models.Admin = Depends(auth.get_current_user)):
    """
    Refreshes the current access token.
    This creates a sliding session: as long as the user is valid, they can get a new token.
    """
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": current_user.email}, expires_delta=access_token_expires)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=auth.settings.ENVIRONMENT == "production"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
