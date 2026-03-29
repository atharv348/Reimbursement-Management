from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.core.auth import get_current_user
from app.services.ocr import extract_receipt_data
from app.services.currency import get_exchange_rate
import shutil
import os
import io
import pandas as pd
from datetime import datetime
from typing import List
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

from app.services.workflow import initialize_approval_flow

from app.db.session import supabase

@router.post("/submit")
async def submit_expense(
    amount: float = Form(...),
    currency: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    applicant_name: str = Form(None),
    applicant_email: str = Form(None),
    is_manager_approver: bool = Form(True),
    receipt: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If applicant details are not provided in the form, fall back to current_user
    final_applicant_name = applicant_name if applicant_name else current_user.full_name
    final_applicant_email = applicant_email if applicant_email else current_user.email
    employee_id = current_user.id

    # 1. Store receipt file in Supabase Storage if provided
    receipt_url = None
    if receipt and supabase:
        try:
            file_name = f"{employee_id}_{datetime.now().timestamp()}_{receipt.filename}"
            bucket_name = "receipts"
            file_bytes = await receipt.read()
            res = supabase.storage.from_(bucket_name).upload(
                path=file_name,
                file=file_bytes,
                file_options={"content-type": receipt.content_type}
            )
            receipt_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        except Exception as e:
            print(f"Supabase Storage Error: {e}")
            pass
    
    # 2. Get base currency rate for conversion
    rate = await get_exchange_rate(current_user.company.base_currency, currency)
    base_amount = amount / rate if rate else amount
    
    # 3. Create Expense Record
    new_expense = models.Expense(
        amount=amount,
        currency=currency,
        base_amount=base_amount,
        category=category,
        description=description,
        date=datetime.strptime(date, "%Y-%m-%d"),
        employee_id=employee_id,
        applicant_name=final_applicant_name,
        applicant_email=final_applicant_email,
        receipt_url=receipt_url,
        is_manager_approver=is_manager_approver,
        status=models.ExpenseStatus.PENDING
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    try:
        # 4. Initialize Approval Flow
        success = initialize_approval_flow(db, new_expense)
        if not success:
            raise Exception("Approval workflow initialization failed.")
    except Exception as workflow_err:
        print(f"Workflow Initialization Error: {str(workflow_err)}")
        raise HTTPException(status_code=500, detail=f"Submission successful, but approval workflow failed: {str(workflow_err)}")
        
    return new_expense

@router.post("/ocr")
async def ocr_receipt(
    receipt: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Temp save for OCR processing
    file_path = os.path.join(UPLOAD_DIR, f"temp_{current_user.id}_{receipt.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(receipt.file, buffer)
    
    # Call Gemini OCR
    data = await extract_receipt_data(file_path)
    
    # Cleanup temp file
    if os.path.exists(file_path):
        os.remove(file_path)
        
    if not data:
        raise HTTPException(status_code=500, detail="OCR processing failed to return data.")
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
        
    return data

@router.get("/history", response_model=List[schemas.ExpenseOut])
def get_expense_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Expense).filter(
        models.Expense.employee_id == current_user.id
    ).order_by(models.Expense.created_at.desc()).all()

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.employee_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.status != models.ExpenseStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending expenses can be deleted")

    try:
        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting expense: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/export")
def export_expenses_excel(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Helper to get string value from Enum
        def get_val(obj):
            if hasattr(obj, 'value'):
                return obj.value
            return str(obj)

        # Get the role string correctly from the Enum member
        user_role = get_val(current_user.role).lower()
        
        # Only allow Admin, Manager, Finance, or Director to export all data
        if user_role not in ["admin", "manager", "finance", "director"]:
            # Filter for current user only
            expenses = db.query(models.Expense).filter(models.Expense.employee_id == current_user.id).all()
        else:
            # Export all for company
            expenses = db.query(models.Expense).join(models.User).filter(models.User.company_id == current_user.company_id).all()
        
        if not expenses:
            print(f"No expenses found for user {current_user.email} (Role: {user_role})")
            raise HTTPException(status_code=404, detail="No expenses found to export")

        # Prepare data for Excel
        data = []
        for exp in expenses:
            # Get individual status for each level
            # Level 1: Manager, Level 2: Finance, Level 3: Director
            # ADMIN role should NOT be mentioned in Excel.
            
            approvals = db.query(models.ExpenseApproval).filter(
                models.ExpenseApproval.expense_id == exp.id
            ).all()
            
            manager_status = "N/A"
            finance_status = "N/A"
            director_status = "N/A"
            
            decision_by_role = "N/A"
            
            # Map sequence to roles, excluding any "Admin" mention
            for ap in approvals:
                status_str = get_val(ap.status).capitalize()
                
                # Check approver role - if Admin, we don't mention them as "Admin"
                approver_role = get_val(ap.approver.role).lower() if ap.approver else ""
                
                if ap.sequence_order == 1:
                    manager_status = status_str
                    if status_str in ["Approved", "Rejected"]:
                        decision_by_role = "Manager"
                elif ap.sequence_order == 2:
                    finance_status = status_str
                    if status_str in ["Approved", "Rejected"]:
                        decision_by_role = "Finance"
                elif ap.sequence_order == 3:
                    director_status = status_str
                    if status_str in ["Approved", "Rejected"]:
                        decision_by_role = "Director"

            data.append({
                "Applicant Name": exp.applicant_name or (exp.employee.full_name if exp.employee else "Unknown"),
                "Applicant Email ID": exp.applicant_email or (exp.employee.email if exp.employee else "Unknown"),
                "Amount": exp.amount,
                "Currency": exp.currency,
                "Category": exp.category,
                "Description": exp.description,
                "Date of Expense": exp.date.strftime("%Y-%m-%d") if exp.date else "N/A",
                "Status": get_val(exp.status).capitalize(),
                "Decision By (Role)": decision_by_role, # Strictly Manager, Finance, or Director
                "Receipt URL": exp.receipt_url or "No receipt"
            })

        df = pd.DataFrame(data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Expenses')
        
        output.seek(0)
        
        filename = f"expenses_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL EXPORT ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error during export: {str(e)}")
