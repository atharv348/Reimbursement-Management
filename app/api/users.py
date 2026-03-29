from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.core.auth import get_current_user, get_password_hash
from typing import List

router = APIRouter(prefix="/users", tags=["User Management"])

@router.post("/employees", response_model=schemas.UserOut)
def create_employee(
    user_in: schemas.UserCreate, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"Attempting to create user: {user_in.email} by {current_user.email}")
    # Standardize role check
    role_name = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_name not in ["admin", "manager"]:
        print(f"Permission denied for {current_user.email} (Role: {role_name})")
        raise HTTPException(status_code=403, detail="Only admins or managers can create users")
    
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        print(f"User already exists: {user_in.email}")
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Check if manager exists (if manager_id provided)
    if user_in.manager_id:
        manager = db.query(models.User).filter(models.User.id == user_in.manager_id).first()
        if not manager:
            print(f"Manager not found: {user_in.manager_id}")
            raise HTTPException(status_code=400, detail=f"Manager ID {user_in.manager_id} does not exist. Please check the user list for valid IDs.")
    
    try:
        hashed_password = get_password_hash(user_in.password)
        new_user = models.User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role, # Can be Employee or Manager
            company_id=current_user.company_id,
            manager_id=user_in.manager_id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Successfully created user: {new_user.email} (ID: {new_user.id})")
        return new_user
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("", response_model=List[schemas.UserOut])
@router.get("/", response_model=List[schemas.UserOut])
def get_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Standardize role check to strings/values to avoid Enum mismatch
    role_name = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_name in ["admin", "manager"]:
        return db.query(models.User).filter(models.User.company_id == current_user.company_id).all()
    else:
        raise HTTPException(status_code=403, detail=f"Not authorized to view users (Role: {role_name})")

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_name != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    user_to_delete = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.company_id == current_user.company_id
    ).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    try:
        # If this user is a manager, set manager_id of subordinates to null
        db.query(models.User).filter(models.User.manager_id == user_id).update({"manager_id": None})
        
        db.delete(user_to_delete)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}
