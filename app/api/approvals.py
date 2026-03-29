from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.core.auth import get_current_user
from app.services.workflow import process_approval
from typing import List

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.get("/pending", response_model=List[schemas.ExpenseApprovalOut])
def get_pending_approvals(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all approvals assigned to current user that are PENDING
    return db.query(models.ExpenseApproval).filter(
        models.ExpenseApproval.approver_id == current_user.id,
        models.ExpenseApproval.status == models.ExpenseStatus.PENDING
    ).all()

@router.post("/{approval_id}/approve")
def approve_expense(
    approval_id: int,
    action: schemas.ApprovalAction,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(models.ExpenseApproval).filter(models.ExpenseApproval.id == approval_id).first()
    if not approval or approval.approver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this expense")
    
    comments = action.comments
    expense = process_approval(db, approval_id, models.ExpenseStatus.APPROVED, comments)
    return {"message": "Expense Approved", "status": expense.status}

@router.post("/{approval_id}/reject")
def reject_expense(
    approval_id: int,
    action: schemas.ApprovalAction,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(models.ExpenseApproval).filter(models.ExpenseApproval.id == approval_id).first()
    if not approval or approval.approver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this expense")
    
    comments = action.comments
    expense = process_approval(db, approval_id, models.ExpenseStatus.REJECTED, comments)
    return {"message": "Expense Rejected", "status": expense.status}

@router.get("/history", response_model=List[schemas.ExpenseApprovalOut])
def get_approval_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all approvals assigned to current user that are NOT WAITING or PENDING
    return db.query(models.ExpenseApproval).filter(
        models.ExpenseApproval.approver_id == current_user.id,
        models.ExpenseApproval.status.in_([models.ExpenseStatus.APPROVED, models.ExpenseStatus.REJECTED])
    ).order_by(models.ExpenseApproval.updated_at.desc()).all()
