# Aegis Backend

## Windows PowerShell setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

In TEST_MODE, OTPs print in the server console and SMS messages are logged instead of sent.
