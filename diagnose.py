"""Quick diagnostic — run this from the api/ venv to find the crashing import.

Usage:
    cd ~/Desktop/Cam/CAMIQ/api
    source .venv/bin/activate
    python ../diagnose.py
"""

import sys
print(f"Python {sys.version}")
print()

steps = [
    ("fastapi",            "from fastapi import FastAPI"),
    ("uvicorn",            "import uvicorn"),
    ("pydantic",           "from pydantic import BaseModel"),
    ("vaderSentiment",     "from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer"),
    ("python-multipart",   "import multipart"),
    ("httpx",              "import httpx"),
    ("app.schemas.analyze","from app.schemas.analyze import AnalyzeResponse"),
    ("app.schemas.bias",   "from app.schemas.bias import BiasAuditResponse"),
    ("app.services.sentiment", "from app.services.sentiment import active_model_name"),
    ("app.services.bias",  "from app.services.bias import run_bias_audit"),
    ("app.services.topics","from app.services.topics import extract_topics"),
    ("app.routers.analyze","from app.routers.analyze import router"),
    ("app.routers.analyses","from app.routers.analyses import router"),
    ("app.routers.countries","from app.routers.countries import router"),
    ("app.routers.topics", "from app.routers.topics import router"),
    ("app.routers.bias",   "from app.routers.bias import router"),
    ("main (full app)",    "from main import app"),
]

for label, stmt in steps:
    try:
        exec(stmt)
        print(f"  OK  {label}")
    except Exception as e:
        print(f" FAIL {label}  -->  {type(e).__name__}: {e}")

print()
print("If all OK above, try: uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug")
print("The --log-level debug flag will show any traceback that kills the process.")
