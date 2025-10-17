#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import asyncio
import uuid
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent.parent / 'backend'
load_dotenv(backend_dir / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("Admin user already exists!")
        return
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "name": "Administrator",
        "password": pwd_context.hash("admin123"),  # Change this password!
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print("Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")
    print("Please change the password after first login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
