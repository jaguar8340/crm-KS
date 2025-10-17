#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent.parent / 'backend'
load_dotenv(backend_dir / '.env')

async def migrate_customers():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Update all customers to have bemerkungen and korrespondenz as arrays
    print("Migrating customers...")
    
    customers = await db.customers.find({}).to_list(1000)
    
    for customer in customers:
        update_needed = False
        updates = {}
        
        # Convert old bemerkungen string to array
        if 'bemerkungen' in customer:
            if isinstance(customer['bemerkungen'], str) and customer['bemerkungen']:
                # Convert old string bemerkungen to array format
                updates['bemerkungen'] = [{
                    "text": customer['bemerkungen'],
                    "timestamp": customer.get('created_at', ''),
                    "user": "System (Migration)"
                }]
                update_needed = True
            elif not isinstance(customer['bemerkungen'], list):
                updates['bemerkungen'] = []
                update_needed = True
        else:
            updates['bemerkungen'] = []
            update_needed = True
        
        # Add korrespondenz if not exists
        if 'korrespondenz' not in customer:
            updates['korrespondenz'] = []
            update_needed = True
        
        if update_needed:
            await db.customers.update_one(
                {"_id": customer["_id"]},
                {"$set": updates}
            )
            print(f"Updated customer: {customer.get('kunden_nr', 'Unknown')}")
    
    print("Migration completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_customers())
