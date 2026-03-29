from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import models
from typing import List, Optional

def default_approval_fallback(db: Session, expense: models.Expense, employee: models.User, company: models.Company):
    if employee.manager_id:
        approval = models.ExpenseApproval(
            expense_id=expense.id,
            approver_id=employee.manager_id,
            sequence_order=1,
            status=models.ExpenseStatus.PENDING
        )
        db.add(approval)
        db.commit()
        return True
    else:
        # Standardize on UPPERCASE for DB Enum compatibility
        admin = db.query(models.User).filter(
            models.User.company_id == company.id,
            or_(models.User.role == "ADMIN", models.User.role == "admin")
        ).first()
        if admin:
            approval = models.ExpenseApproval(
                expense_id=expense.id,
                approver_id=admin.id,
                sequence_order=1,
                status=models.ExpenseStatus.PENDING
            )
            db.add(approval)
            db.commit()
            return True
    return False

def initialize_approval_flow(db: Session, expense: models.Expense):
    employee = expense.employee
    if not employee:
        print(f"Error: Expense {expense.id} has no employee relationship!")
        return False
        
    company = employee.company
    if not company:
        print(f"Error: Employee {employee.id} has no company relationship!")
        return False
        
    amount = expense.amount
    
    # We will map roles to fixed sequence orders:
    # 1: Manager, 2: Finance, 3: Director
    steps = [] # List of (approver_id, sequence_order)
    
    # 1. Manager Step (Always Required)
    manager_id = employee.manager_id
    if not manager_id:
        # Fallback to Admin if no manager exists
        admin = db.query(models.User).filter(
            models.User.company_id == company.id,
            or_(models.User.role == "ADMIN", models.User.role == "admin")
        ).first()
        if admin:
            manager_id = admin.id
            
    if manager_id:
        steps.append((manager_id, 1))

    # 2. Finance Step (Required if amount >= 10,000)
    if amount >= 10000:
        finance_user = db.query(models.User).filter(
            models.User.company_id == company.id,
            or_(models.User.role == "FINANCE", models.User.role == "finance")
        ).first()
        
        finance_id = None
        if finance_user:
            finance_id = finance_user.id
        else:
            # Fallback to Admin
            admin = db.query(models.User).filter(
                models.User.company_id == company.id,
                or_(models.User.role == "ADMIN", models.User.role == "admin")
            ).first()
            if admin:
                finance_id = admin.id
        
        if finance_id:
            steps.append((finance_id, 2))

    # 3. Director Step (Required if amount >= 30,000)
    if amount >= 30000:
        director_user = db.query(models.User).filter(
            models.User.company_id == company.id,
            or_(models.User.role == "DIRECTOR", models.User.role == "director")
        ).first()
        
        director_id = None
        if director_user:
            director_id = director_user.id
        else:
            # Fallback to Admin
            admin = db.query(models.User).filter(
                models.User.company_id == company.id,
                or_(models.User.role == "ADMIN", models.User.role == "admin")
            ).first()
            if admin:
                director_id = admin.id
                
        if director_id:
            steps.append((director_id, 3))

    # 4. Final Fallback if no steps were added
    if not steps:
        print(f"Warning: No approvers found for expense {expense.id}. Falling back to default.")
        return default_approval_fallback(db, expense, employee, company)

    # Sort steps by sequence order just in case
    steps.sort(key=lambda x: x[1])

    # Create ExpenseApproval records
    for i, (approver_id, sequence_order) in enumerate(steps):
        # The first step in the actual list should be PENDING, others WAITING
        status = models.ExpenseStatus.PENDING if i == 0 else models.ExpenseStatus.WAITING
        approval = models.ExpenseApproval(
            expense_id=expense.id,
            approver_id=approver_id,
            sequence_order=sequence_order, # Use the fixed role-based order
            status=status
        )
        db.add(approval)
    
    # Update expense status to show it's starting
    expense.status = models.ExpenseStatus.PENDING
    
    db.commit()
    return True

def check_rule_completion(db: Session, expense: models.Expense, rule: models.ApprovalRule):
    """Checks if a percentage, specific, or hybrid rule is satisfied."""
    approvals = db.query(models.ExpenseApproval).filter(
        models.ExpenseApproval.expense_id == expense.id
    ).all()
    
    total_approvers = len(approvals)
    approved_count = sum(1 for a in approvals if a.status == models.ExpenseStatus.APPROVED)
    rejected_count = sum(1 for a in approvals if a.status == models.ExpenseStatus.REJECTED)
    
    # If any single person rejects in these parallel rules, usually the whole thing is rejected
    # (This can be customized based on requirements)
    if rejected_count > 0:
        return models.ExpenseStatus.REJECTED

    if rule.rule_type == "percentage":
        threshold = rule.config.get("threshold_percentage", 60)
        current_percentage = (approved_count / total_approvers) * 100
        if current_percentage >= threshold:
            return models.ExpenseStatus.APPROVED

    elif rule.rule_type == "specific_approver":
        specific_id = rule.config.get("specific_approver_id")
        specific_approval = next((a for a in approvals if a.approver_id == specific_id), None)
        if specific_approval and specific_approval.status == models.ExpenseStatus.APPROVED:
            return models.ExpenseStatus.APPROVED

    elif rule.rule_type == "hybrid":
        # e.g., 60% OR CFO approves
        threshold = rule.config.get("threshold_percentage", 60)
        specific_id = rule.config.get("specific_approver_id")
        
        current_percentage = (approved_count / total_approvers) * 100
        specific_approval = next((a for a in approvals if a.approver_id == specific_id), None)
        
        if current_percentage >= threshold or (specific_approval and specific_approval.status == models.ExpenseStatus.APPROVED):
            return models.ExpenseStatus.APPROVED

    return models.ExpenseStatus.PENDING

def process_approval(db: Session, approval_id: int, status: models.ExpenseStatus, comments: str = None):
    approval = db.query(models.ExpenseApproval).filter(models.ExpenseApproval.id == approval_id).first()
    if not approval:
        return None
    
    approval.status = status
    approval.comments = comments
    db.commit()
    
    expense = approval.expense
    company = expense.employee.company
    
    # Check for active rules
    rule = db.query(models.ApprovalRule).filter(
        models.ApprovalRule.company_id == company.id,
        models.ApprovalRule.is_active == True
    ).first()

    # If it's a parallel rule (percentage/hybrid/specific)
    if rule and rule.rule_type in ["percentage", "specific_approver", "hybrid"]:
        result_status = check_rule_completion(db, expense, rule)
        if result_status != models.ExpenseStatus.PENDING:
            expense.status = result_status
            db.commit()
        return expense

    # Sequential Logic (Default or 'sequence' rule)
    if status == models.ExpenseStatus.REJECTED:
        expense.status = models.ExpenseStatus.REJECTED
        # Also mark any remaining WAITING approvals as REJECTED or similar to close them
        db.query(models.ExpenseApproval).filter(
            models.ExpenseApproval.expense_id == expense.id,
            models.ExpenseApproval.status == models.ExpenseStatus.WAITING
        ).update({"status": models.ExpenseStatus.REJECTED})
        
        # Notify employee
        notification = models.Notification(
            user_id=expense.employee_id,
            title="Expense Rejected ❌",
            message=f"Your expense claim for ₹{expense.amount} has been rejected. Comment: {comments or 'No reason provided.'}"
        )
        db.add(notification)
    else:
        # Check if there's a next one in sequence
        next_approval = db.query(models.ExpenseApproval).filter(
            models.ExpenseApproval.expense_id == expense.id,
            models.ExpenseApproval.sequence_order > approval.sequence_order,
            models.ExpenseApproval.status == models.ExpenseStatus.WAITING
        ).order_by(models.ExpenseApproval.sequence_order).first()
        
        if next_approval:
            print(f"Moving to next approver: {next_approval.approver_id}")
            next_approval.status = models.ExpenseStatus.PENDING
        else:
            # Check if there are any other PENDING approvals (e.g. in parallel rules)
            other_pending = db.query(models.ExpenseApproval).filter(
                models.ExpenseApproval.expense_id == expense.id,
                models.ExpenseApproval.id != approval_id,
                models.ExpenseApproval.status == models.ExpenseStatus.PENDING
            ).first()
            
            if not other_pending:
                # All steps in sequence finished
                expense.status = models.ExpenseStatus.APPROVED
                
                # Notify employee
                notification = models.Notification(
                    user_id=expense.employee_id,
                    title="Expense Approved ✅",
                    message=f"Your expense claim for ₹{expense.amount} has been fully approved and processed."
                )
                db.add(notification)
            
    db.commit()
    return expense
