import hashlib
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db, AsyncSessionLocal
from app.models.db_models import User
from app.models.schemas import UserLogin, UserResponse

import os
from typing import Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication & User Access"])

def hash_password(password: str) -> str:
    """Deterministic salted SHA-256 hash for authentication"""
    salt = "sentinel_gujarat_police_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

async def seed_default_user():
    """Ensure official user exists in database and synchronize with environment variables"""
    admin_email = os.getenv("ADMIN_EMAIL", "jyoti@deventtechnology.com").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "123456")

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User).where(User.email == admin_email))
            user = result.scalar_one_or_none()
            if not user:
                logger.info(f"Seeding default authenticated officer: {admin_email}")
                new_user = User(
                    email=admin_email,
                    name="Jyoti (Surveillance Commander)",
                    password_hash=hash_password(admin_password),
                    role="Superintendent of Police (IT & Cyber)",
                    badge_number="GP-7829",
                    department="Gujarat Police Command & Control Centre",
                    is_active=True
                )
                db.add(new_user)
                await db.commit()
                logger.info("Default officer credentials seeded into database successfully.")
            else:
                # If password changed in environment or code, update it
                user.password_hash = hash_password(admin_password)
                await db.commit()
                logger.info(f"Officer credentials verified and active for: {admin_email}")
        except Exception as e:
            logger.error(f"Error seeding default user: {e}")


@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate officer from database.
    Verifies user credentials against SQLite/PostgreSQL users table.
    """
    clean_email = credentials.email.strip().lower()
    
    # Query user from database
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Access Denied."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer account is deactivated. Contact Gujarat Police IT Admin."
        )

    # Verify password hash against database record
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Access Denied."
        )

    # Generate secure session token
    token = f"sentinel_gp_{uuid.uuid4().hex}"

    logger.info(f"Officer {user.email} authenticated successfully. Badge: {user.badge_number}")

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        badge_number=user.badge_number,
        department=user.department,
        token=token
    )

@router.get("/me")
async def get_current_user(email: str = "jyoti@deventtechnology.com", db: AsyncSession = Depends(get_db)):
    """Fetch current authenticated officer profile from database"""
    result = await db.execute(select(User).where(User.email == email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "badge_number": user.badge_number,
        "department": user.department
    }


class UpdateCredentialsRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

@router.post("/update-credentials")
async def update_credentials(req: UpdateCredentialsRequest, db: AsyncSession = Depends(get_db)):
    """Update officer password in database"""
    result = await db.execute(select(User).where(User.email == req.email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    
    user.password_hash = hash_password(req.new_password)
    await db.commit()
    logger.info(f"Credentials updated in database for {user.email}")
    return {"success": True, "message": f"Password updated successfully for {user.email}"}

