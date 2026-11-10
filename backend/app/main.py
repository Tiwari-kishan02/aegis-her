import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import admin, alerts, auth, contacts

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Aegis API", version="1.0.0")
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(contacts.me_router)
app.include_router(alerts.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
