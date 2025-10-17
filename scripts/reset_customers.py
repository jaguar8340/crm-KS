import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path('backend') / '.env')

async def fix_all():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Force update all customers
    await db.customers.update_many(
        {}, 
        {'$set': {'bemerkungen': [], 'korrespondenz': []}}
    )
    print('Reset all customers')
    client.close()

asyncio.run(fix_all())
