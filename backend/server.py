from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from dateutil.relativedelta import relativedelta
import csv
import io
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Models
class UserBase(BaseModel):
    username: str
    name: str
    role: str = "user"  # admin or user

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class Remark(BaseModel):
    text: str
    timestamp: str
    user: str

class Correspondence(BaseModel):
    bemerkung: str
    datum: str
    zeit: str
    textfeld: str
    upload1: Optional[str] = ""
    upload2: Optional[str] = ""
    upload3: Optional[str] = ""
    timestamp: str
    user: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kunden_nr: str
    vorname: str
    name: str
    firma: Optional[str] = ""
    strasse: str
    plz: str
    ort: str
    telefon_p: Optional[str] = ""
    telefon_g: Optional[str] = ""
    natel: Optional[str] = ""
    email_p: Optional[str] = ""
    email_g: Optional[str] = ""
    geburtsdatum: Optional[str] = ""
    bemerkungen: List[dict] = Field(default_factory=list)
    korrespondenz: List[dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    kunden_nr: str
    vorname: str
    name: str
    firma: Optional[str] = ""
    strasse: str
    plz: str
    ort: str
    telefon_p: Optional[str] = ""
    telefon_g: Optional[str] = ""
    natel: Optional[str] = ""
    email_p: Optional[str] = ""
    email_g: Optional[str] = ""
    geburtsdatum: Optional[str] = ""

class RemarkCreate(BaseModel):
    text: str

class CorrespondenceCreate(BaseModel):
    bemerkung: str
    datum: str
    zeit: str
    textfeld: str
    upload1: Optional[str] = ""
    upload2: Optional[str] = ""
    upload3: Optional[str] = ""

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    marke: str
    modell: str
    chassis_nr: str
    stamm_nr: Optional[str] = ""
    typenschein_nr: Optional[str] = ""
    farbe: Optional[str] = ""
    inverkehrsetzung: Optional[str] = ""
    km_stand: Optional[str] = ""
    vista_nr: Optional[str] = ""
    verkaeufer: Optional[str] = ""
    kundenberater: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VehicleCreate(BaseModel):
    customer_id: str
    marke: str
    modell: str
    chassis_nr: str
    stamm_nr: Optional[str] = ""
    typenschein_nr: Optional[str] = ""
    farbe: Optional[str] = ""
    inverkehrsetzung: Optional[str] = ""
    km_stand: Optional[str] = ""
    vista_nr: Optional[str] = ""
    verkaeufer: Optional[str] = ""
    kundenberater: Optional[str] = ""

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vorname: str
    name: str
    strasse: str
    plz: str
    ort: str
    email: str
    telefon: str
    eintritt_firma: str  # Date as string (YYYY-MM-DD)
    geburtstag: str  # Date as string (YYYY-MM-DD)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    vorname: str
    name: str
    strasse: str
    plz: str
    ort: str
    email: str
    telefon: str
    eintritt_firma: str
    geburtstag: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    datum_kontakt: str
    zeitpunkt_kontakt: str
    bemerkungen: str
    telefon_nummer: str
    assigned_to: str  # user_id
    assigned_to_name: str
    status: str = "offen"  # offen, erledigt
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    customer_id: str
    customer_name: str
    datum_kontakt: str
    zeitpunkt_kontakt: str
    bemerkungen: str
    telefon_nummer: str
    assigned_to: str
    assigned_to_name: str


# Client Experience Models
class Action(BaseModel):
    text: str
    timestamp: str
    user: str

class ClientExperience(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: Optional[str] = ""
    customer_name: str
    marke: str
    modell: str
    datum: str
    zeit: str
    kundenreklamation: str
    datei_upload: Optional[str] = ""
    aktionen: List[dict] = Field(default_factory=list)
    status: str = "offen"  # offen or erledigt
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str

class ClientExperienceCreate(BaseModel):
    customer_id: Optional[str] = ""
    customer_name: str
    marke: str
    modell: str
    datum: str
    zeit: str
    kundenreklamation: str
    datei_upload: Optional[str] = ""

class ActionCreate(BaseModel):
    text: str

# Kaufverträge Models
class Kaufvertrag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Kundeninfo
    kunde_name: str
    kunde_vorname: str
    kunde_plz: Optional[str] = ""
    kunde_ort: Optional[str] = ""
    kunde_telefon: Optional[str] = ""
    kunde_email: Optional[str] = ""
    # Fahrzeug
    fahrzeug_marke: str
    fahrzeug_modell: str
    fahrzeug_chassis_nr: str
    fahrzeug_stamm_nr: Optional[str] = ""
    fahrzeug_farbe: Optional[str] = ""
    fahrzeug_inverkehrsetzung: Optional[str] = ""
    fahrzeug_typ: str  # Neuwagen, Vorführwagen, Occasion
    verkaufspreis: str
    # Eintauschwagen
    eintausch_marke: Optional[str] = ""
    eintausch_modell: Optional[str] = ""
    eintausch_chassis_nr: Optional[str] = ""
    eintausch_stamm_nr: Optional[str] = ""
    eintausch_farbe: Optional[str] = ""
    eintausch_inverkehrsetzung: Optional[str] = ""
    eintausch_km_stand: Optional[str] = ""
    eintausch_preis: Optional[str] = ""
    eintausch_bemerkungen: Optional[str] = ""
    eintausch_upload_ausweis: Optional[str] = ""
    eintausch_upload_aussen: Optional[str] = ""
    eintausch_upload_innen: Optional[str] = ""
    eintausch_uploads: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str

class KaufvertragCreate(BaseModel):
    kunde_name: str
    kunde_vorname: str
    kunde_plz: Optional[str] = ""
    kunde_ort: Optional[str] = ""
    kunde_telefon: Optional[str] = ""
    kunde_email: Optional[str] = ""
    fahrzeug_marke: str
    fahrzeug_modell: str
    fahrzeug_chassis_nr: str
    fahrzeug_stamm_nr: Optional[str] = ""
    fahrzeug_farbe: Optional[str] = ""
    fahrzeug_inverkehrsetzung: Optional[str] = ""
    fahrzeug_typ: str
    verkaufspreis: str
    eintausch_marke: Optional[str] = ""
    eintausch_modell: Optional[str] = ""
    eintausch_chassis_nr: Optional[str] = ""
    eintausch_stamm_nr: Optional[str] = ""
    eintausch_farbe: Optional[str] = ""
    eintausch_inverkehrsetzung: Optional[str] = ""
    eintausch_km_stand: Optional[str] = ""
    eintausch_preis: Optional[str] = ""
    eintausch_bemerkungen: Optional[str] = ""
    eintausch_upload_ausweis: Optional[str] = ""
    eintausch_upload_aussen: Optional[str] = ""
    eintausch_upload_innen: Optional[str] = ""
    eintausch_uploads: List[str] = Field(default_factory=list)

# Routes
@api_router.get("/")
async def root():
    return {"message": "CRM API"}

# Auth routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Remove password from response
    user_data = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# User management routes (admin only)
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, admin: dict = Depends(get_admin_user)):
    # Check if username already exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_dict = user_data.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_obj = User(**{k: v for k, v in user_dict.items() if k != "password"})
    
    doc = user_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["password"] = user_dict["password"]
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user["created_at"], str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# Customer routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer_obj = Customer(**customer_data.model_dump())
    doc = customer_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.customers.insert_one(doc)
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer["created_at"], str):
            customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer["created_at"], str):
        customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.customers.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_data.model_dump()
    await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if isinstance(updated["created_at"], str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    # Also delete associated vehicles
    await db.vehicles.delete_many({"customer_id": customer_id})
    return {"message": "Customer deleted"}


# Customer Remarks routes
@api_router.post("/customers/{customer_id}/remarks")
async def add_remark(customer_id: str, remark_data: RemarkCreate, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    new_remark = {
        "text": remark_data.text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": current_user["name"]
    }
    
    await db.customers.update_one(
        {"id": customer_id},
        {"$push": {"bemerkungen": new_remark}}
    )
    
    return {"message": "Remark added", "remark": new_remark}

# Customer Correspondence routes
@api_router.post("/customers/{customer_id}/correspondence")
async def add_correspondence(customer_id: str, correspondence_data: CorrespondenceCreate, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    new_correspondence = {
        "bemerkung": correspondence_data.bemerkung,
        "datum": correspondence_data.datum,
        "zeit": correspondence_data.zeit,
        "textfeld": correspondence_data.textfeld,
        "upload1": correspondence_data.upload1,
        "upload2": correspondence_data.upload2,
        "upload3": correspondence_data.upload3,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": current_user["name"]
    }
    
    await db.customers.update_one(
        {"id": customer_id},
        {"$push": {"korrespondenz": new_correspondence}}
    )
    
    return {"message": "Correspondence added", "correspondence": new_correspondence}


# Vehicle routes
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    vehicle_obj = Vehicle(**vehicle_data.model_dump())
    doc = vehicle_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.vehicles.insert_one(doc)
    return vehicle_obj

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(customer_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"customer_id": customer_id} if customer_id else {}
    vehicles = await db.vehicles.find(query, {"_id": 0}).to_list(1000)
    for vehicle in vehicles:
        if isinstance(vehicle["created_at"], str):
            vehicle["created_at"] = datetime.fromisoformat(vehicle["created_at"])
    return vehicles

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if isinstance(vehicle["created_at"], str):
        vehicle["created_at"] = datetime.fromisoformat(vehicle["created_at"])
    return vehicle

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.vehicles.find_one({"id": vehicle_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_data.model_dump()
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    updated = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if isinstance(updated["created_at"], str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}


# CSV Upload routes
@api_router.post("/customers/upload-csv")
async def upload_customers_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        csv_data = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                customer_data = {
                    "kunden_nr": row.get("kunden_nr", ""),
                    "vorname": row.get("vorname", ""),
                    "name": row.get("name", ""),
                    "firma": row.get("firma", ""),
                    "strasse": row.get("strasse", ""),
                    "plz": row.get("plz", ""),
                    "ort": row.get("ort", ""),
                    "telefon_p": row.get("telefon_p", ""),
                    "telefon_g": row.get("telefon_g", ""),
                    "natel": row.get("natel", ""),
                    "email_p": row.get("email_p", ""),
                    "email_g": row.get("email_g", ""),
                    "geburtsdatum": row.get("geburtsdatum", ""),
                    "bemerkungen": row.get("bemerkungen", ""),
                }
                
                # Validate required fields
                if not customer_data["kunden_nr"] or not customer_data["vorname"] or not customer_data["name"]:
                    errors.append(f"Zeile {row_num}: Pflichtfelder fehlen (kunden_nr, vorname, name)")
                    continue
                
                customer_obj = Customer(**customer_data)
                doc = customer_obj.model_dump()
                doc["created_at"] = doc["created_at"].isoformat()
                await db.customers.insert_one(doc)
                imported_count += 1
            except Exception as e:
                errors.append(f"Zeile {row_num}: {str(e)}")
        
        return {
            "imported": imported_count,
            "errors": errors,
            "message": f"{imported_count} Kunden erfolgreich importiert"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Verarbeiten der CSV: {str(e)}")

@api_router.post("/vehicles/upload-csv")
async def upload_vehicles_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        csv_data = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Find customer by kunden_nr
                customer_nr = row.get("kunden_nr", "")
                if not customer_nr:
                    errors.append(f"Zeile {row_num}: kunden_nr fehlt")
                    continue
                
                customer = await db.customers.find_one({"kunden_nr": customer_nr}, {"_id": 0})
                if not customer:
                    errors.append(f"Zeile {row_num}: Kunde mit Nr. {customer_nr} nicht gefunden")
                    continue
                
                vehicle_data = {
                    "customer_id": customer["id"],
                    "marke": row.get("marke", ""),
                    "modell": row.get("modell", ""),
                    "chassis_nr": row.get("chassis_nr", ""),
                    "stamm_nr": row.get("stamm_nr", ""),
                    "typenschein_nr": row.get("typenschein_nr", ""),
                    "farbe": row.get("farbe", ""),
                    "inverkehrsetzung": row.get("inverkehrsetzung", ""),
                    "km_stand": row.get("km_stand", ""),
                    "vista_nr": row.get("vista_nr", ""),
                    "verkaeufer": row.get("verkaeufer", ""),
                    "kundenberater": row.get("kundenberater", ""),
                }
                
                # Validate required fields
                if not vehicle_data["marke"] or not vehicle_data["modell"] or not vehicle_data["chassis_nr"]:
                    errors.append(f"Zeile {row_num}: Pflichtfelder fehlen (marke, modell, chassis_nr)")
                    continue
                
                vehicle_obj = Vehicle(**vehicle_data)
                doc = vehicle_obj.model_dump()
                doc["created_at"] = doc["created_at"].isoformat()
                await db.vehicles.insert_one(doc)
                imported_count += 1
            except Exception as e:
                errors.append(f"Zeile {row_num}: {str(e)}")
        
        return {
            "imported": imported_count,
            "errors": errors,
            "message": f"{imported_count} Fahrzeuge erfolgreich importiert"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Verarbeiten der CSV: {str(e)}")


# Employee routes
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    employee_obj = Employee(**employee_data.model_dump())
    doc = employee_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.employees.insert_one(doc)
    return employee_obj

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for employee in employees:
        if isinstance(employee["created_at"], str):
            employee["created_at"] = datetime.fromisoformat(employee["created_at"])
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if isinstance(employee["created_at"], str):
        employee["created_at"] = datetime.fromisoformat(employee["created_at"])
    return employee

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.employees.find_one({"id": employee_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_data.model_dump()
    await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if isinstance(updated["created_at"], str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}

# Task routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_dict = task_data.model_dump()
    task_dict["created_by"] = current_user["id"]
    task_obj = Task(**task_dict)
    doc = task_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(assigned_to: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if assigned_to:
        query["assigned_to"] = assigned_to
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task["created_at"], str):
            task["created_at"] = datetime.fromisoformat(task["created_at"])
    return tasks

@api_router.get("/tasks/my")
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"assigned_to": current_user["id"]}, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task["created_at"], str):
            task["created_at"] = datetime.fromisoformat(task["created_at"])
    return tasks

@api_router.put("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str, current_user: dict = Depends(get_current_user)):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one({"id": task_id}, {"$set": {"status": status}})
    return {"message": "Task status updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


# File Upload route
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"filename": unique_filename, "path": f"/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Client Experience routes
@api_router.post("/client-experience", response_model=ClientExperience)
async def create_client_experience(ce_data: ClientExperienceCreate, current_user: dict = Depends(get_current_user)):
    ce_dict = ce_data.model_dump()
    ce_dict["created_by"] = current_user["name"]
    ce_obj = ClientExperience(**ce_dict)
    doc = ce_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.client_experiences.insert_one(doc)
    return ce_obj

@api_router.get("/client-experience", response_model=List[ClientExperience])
async def get_client_experiences(current_user: dict = Depends(get_current_user)):
    experiences = await db.client_experiences.find({}, {"_id": 0}).to_list(1000)
    for exp in experiences:
        if isinstance(exp["created_at"], str):
            exp["created_at"] = datetime.fromisoformat(exp["created_at"])
    return experiences

@api_router.get("/client-experience/{ce_id}", response_model=ClientExperience)
async def get_client_experience(ce_id: str, current_user: dict = Depends(get_current_user)):
    experience = await db.client_experiences.find_one({"id": ce_id}, {"_id": 0})
    if not experience:
        raise HTTPException(status_code=404, detail="Client Experience not found")
    if isinstance(experience["created_at"], str):
        experience["created_at"] = datetime.fromisoformat(experience["created_at"])
    return experience

@api_router.post("/client-experience/{ce_id}/solution")
async def add_solution(ce_id: str, solution_data: SolutionCreate, current_user: dict = Depends(get_current_user)):
    experience = await db.client_experiences.find_one({"id": ce_id})
    if not experience:
        raise HTTPException(status_code=404, detail="Client Experience not found")
    
    new_solution = {
        "text": solution_data.text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": current_user["name"]
    }
    
    await db.client_experiences.update_one(
        {"id": ce_id},
        {"$push": {"loesungen": new_solution}}
    )
    
    return {"message": "Solution added", "solution": new_solution}

@api_router.delete("/client-experience/{ce_id}")
async def delete_client_experience(ce_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.client_experiences.delete_one({"id": ce_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client Experience not found")
    return {"message": "Client Experience deleted"}


# Include the router in the main app
app.include_router(api_router)


# Mount uploads directory for static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
