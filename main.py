from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok", "message": "Eva is alive on Cloud Run"}

@app.get("/healthz")
def health():
    return "ok"
