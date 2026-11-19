"""
AGROVISION – AI-Powered Crop Yield Prediction & Optimization System
Smart India Hackathon 2025 (SIH25044)

ASGI Application Entry Point for Uvicorn
Usage:
    uvicorn main:app --reload
    uvicorn main:app --reload --port 8000
    python main.py
"""

import os
import sys
from pathlib import Path

# Resolve base directories
CURRENT_DIR = Path(__file__).resolve().parent

if (CURRENT_DIR / 'backend' / 'config').exists():
    BACKEND_DIR = CURRENT_DIR / 'backend'
    ROOT_DIR = CURRENT_DIR
else:
    BACKEND_DIR = CURRENT_DIR
    ROOT_DIR = CURRENT_DIR.parent

# Ensure backend and root directories are on Python search path
for directory in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if directory not in sys.path:
        sys.path.insert(0, directory)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django
import django
django.setup()

# Initialize ASGI Application
from django.core.asgi import get_asgi_application

app = get_asgi_application()
application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"Starting AGROVISION ASGI server on http://{host}:{port} via Uvicorn...")
    uvicorn.run("main:app", host=host, port=port, reload=True)
