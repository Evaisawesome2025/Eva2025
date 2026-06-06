import os

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse

app = FastAPI(title="Neon Survivor")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_FILE = os.path.join(BASE_DIR, "index.html")


@app.get("/", response_class=HTMLResponse)
def root():
    return FileResponse(GAME_FILE, media_type="text/html")


@app.get("/healthz")
def health():
    return {"status": "ok", "message": "Neon Survivor is alive on Cloud Run"}
