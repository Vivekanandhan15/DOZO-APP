from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str):
    try:
        return pwd_context.verify(password, hashed)
    except Exception:
        # If the hash is invalid (e.g. plain text or different scheme), return False
        # instead of crashing the server.
        return False
