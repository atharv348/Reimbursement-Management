from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from app.core.auth import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
import httpx
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def get_country_currency(country_code: str):
    try:
        async with httpx.AsyncClient() as client:
            # Try searching by code (alpha) if it's 2 or 3 chars, otherwise by name
            if len(country_code) <= 3:
                url = f"https://restcountries.com/v3.1/alpha/{country_code}?fields=currencies"
            else:
                url = f"https://restcountries.com/v3.1/name/{country_code}?fields=currencies"
            
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                # restcountries returns a list for name search and a single object for alpha search
                if isinstance(data, list) and data:
                    currencies = data[0].get("currencies", {})
                elif isinstance(data, dict):
                    currencies = data.get("currencies", {})
                else:
                    return "USD"
                
                if currencies:
                    return list(currencies.keys())[0]
    except Exception as e:
        print(f"Currency API error: {e}")
    return "USD"

@router.post("/signup", response_model=schemas.Token)
async def signup(user_in: schemas.UserCreate, company_in: schemas.CompanyCreate, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Check if company already exists
    db_company = db.query(models.Company).filter(models.Company.name == company_in.name).first()
    if db_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    # 3. Auto-set currency based on country via External API
    currency = await get_country_currency(company_in.country)
    
    # 4. Create Company
    new_company = models.Company(
        name=company_in.name,
        country=company_in.country,
        base_currency=currency
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    # 5. Create Admin User (First user in company)
    hashed_password = get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=models.UserRole.ADMIN,
        company_id=new_company.id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 6. Generate Access Token
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Verify User
    email = form_data.username.strip()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No user found with this email",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Generate Access Token
    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}
