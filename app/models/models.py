from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    FINANCE = "finance"
    DIRECTOR = "director"
    ADMIN = "admin"

class ExpenseStatus(enum.Enum):
    PENDING = "pending"
    WAITING = "waiting"
    APPROVED = "approved"
    REJECTED = "rejected"

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    base_currency = Column(String)
    country = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="company")
    approval_rules = relationship("ApprovalRule", back_populates="company")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    company_id = Column(Integer, ForeignKey("companies.id"))
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="users")
    manager = relationship("User", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("User", back_populates="manager")
    expenses = relationship("Expense", back_populates="employee", cascade="all, delete-orphan")
    approvals = relationship("ExpenseApproval", back_populates="approver", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    currency = Column(String)
    base_amount = Column(Float)  # Converted to company base currency
    category = Column(String)
    description = Column(String)
    date = Column(DateTime)
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    receipt_url = Column(String, nullable=True)
    applicant_name = Column(String, nullable=True)
    applicant_email = Column(String, nullable=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    is_manager_approver = Column(Boolean, default=True)  # Requirement: Expense moves to manager if this is checked
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("User", back_populates="expenses")
    approvals = relationship("ExpenseApproval", back_populates="expense", cascade="all, delete-orphan")

class ApprovalRule(Base):
    __tablename__ = "approval_rules"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String)
    
    # rule_type: "sequence", "percentage", "specific_approver", "hybrid"
    rule_type = Column(String)
    
    # Configuration details for the rule (e.g., sequence of approver IDs, threshold percentage, etc.)
    config = Column(JSON) 
    
    is_active = Column(Boolean, default=True)

    company = relationship("Company", back_populates="approval_rules")

class ExpenseApproval(Base):
    __tablename__ = "expense_approvals"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    comments = Column(String, nullable=True)
    sequence_order = Column(Integer, default=1)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    expense = relationship("Expense", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
