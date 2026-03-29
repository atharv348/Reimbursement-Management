from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, ExpenseStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None
    manager_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    company_id: Optional[int]
    manager_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    country: str
    base_currency: str

class CompanyCreate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    amount: float
    currency: str
    category: str
    description: str
    date: datetime

class ExpenseOut(ExpenseBase):
    id: int
    base_amount: float
    status: ExpenseStatus
    receipt_url: Optional[str]
    employee_id: int
    created_at: datetime
    employee: Optional[UserOut]

    class Config:
        from_attributes = True

class ExpenseApprovalOut(BaseModel):
    id: int
    expense_id: int
    approver_id: int
    status: ExpenseStatus
    comments: Optional[str]
    sequence_order: int
    updated_at: Optional[datetime]
    approver: Optional[UserOut]
    expense: Optional[ExpenseOut]

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    comments: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
