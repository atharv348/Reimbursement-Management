from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas.rules import RuleCreate, RuleOut
from app.core.auth import get_current_user
from typing import List

router = APIRouter(prefix="/rules", tags=["Approval Rules"])

@router.post("/", response_model=RuleOut)
def create_rule(
    rule_in: RuleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins or managers can manage rules")
    
    # Deactivate existing rules for simplicity
    db.query(models.ApprovalRule).filter(
        models.ApprovalRule.company_id == current_user.company_id
    ).update({"is_active": False})
    
    new_rule = models.ApprovalRule(
        name=rule_in.name,
        rule_type=rule_in.rule_type,
        config=rule_in.config,
        company_id=current_user.company_id,
        is_active=True
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.get("", response_model=List[RuleOut])
@router.get("/", response_model=List[RuleOut])
def get_rules(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.ApprovalRule).filter(
        models.ApprovalRule.company_id == current_user.company_id
    ).all()
