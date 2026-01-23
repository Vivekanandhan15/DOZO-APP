from datetime import timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.users import Users
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.utils.timezone_utils import get_ist_now

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = get_ist_now() + expires_delta
    else:
        expire = get_ist_now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print(f"DEBUG: Token payload has no sub. Payload: {payload}")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: JWT Decode Error: {str(e)}")
        print(f"DEBUG: Using SECRET_KEY prefix: {SECRET_KEY[:10]}")
        print(f"DEBUG: Using ALGORITHM: {ALGORITHM}")
        print(f"DEBUG: Token prefix: {token[:10] if token else 'None'}")
        raise credentials_exception
    
    user = db.query(Users).filter(Users.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(roles):
    # Support single string or list
    if isinstance(roles, str):
        roles = [roles]
        
    normalized_roles = [r.upper() for r in roles]
    
    def role_dependency(user=Depends(get_current_user)):
        if user.role.upper() not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Your role: {user.role}. Allowed: {roles}"
            )
        return user
    return role_dependency
