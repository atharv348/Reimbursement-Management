from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas

# Load from project root
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(base_dir, ".env"), override=True)

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

# Debugging: Print status of SECRET_KEY (only first few chars)
if SECRET_KEY == "your-secret-key":
    print("WARNING: Using default SECRET_KEY! Auth will fail if tokens were signed with another key.")
else:
    print(f"Auth initialized with SECRET_KEY starting with: {SECRET_KEY[:4]}...")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = to_encode["sub"].strip()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("Auth failed: Token payload missing 'sub'")
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        email = email.strip()
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        print(f"Auth failed: JWT decoding error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")
    
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        print(f"Auth failed: User not found for email: {token_data.email}")
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
