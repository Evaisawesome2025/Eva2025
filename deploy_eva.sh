#!/usr/bin/env bash
set -euo pipefail

# ---------- Config ----------
PROJECT_ID="$(gcloud config get-value project)"
REGION="us-central1"           # Change if you want a different region
SERVICE="eva"                  # Cloud Run service name
REPO="eva-reg"                 # Artifact Registry repo name
PORT=8080

echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo "Service: $SERVICE"
echo "Repo:    $REPO"
echo "--------"

# ---------- App files ----------
mkdir -p ~/eva && cd ~/eva

# main.py
cat > main.py <<'PY'
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok", "message": "Eva is alive on Cloud Run"}

@app.get("/healthz")
def health():
    return "ok"
PY

# requirements.txt
cat > requirements.txt <<'REQ'
fastapi
uvicorn[standard]
gunicorn
REQ

# Dockerfile
cat > Dockerfile <<'DOCKER'
FROM python:3.10-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080
CMD exec gunicorn -k uvicorn.workers.UvicornWorker --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
DOCKER

# ---------- Enable APIs ----------
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# ---------- Create Artifact Registry repo ----------
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Eva container images" \
  >/dev/null 2>&1 || echo "Repo $REPO already exists."

# ---------- Build & Push ----------
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"
echo "Building image: $IMAGE"
gcloud builds submit --tag "$IMAGE" .

# ---------- Deploy to Cloud Run ----------
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port "$PORT" \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=3 \
  --concurrency=80

# ---------- Show URL ----------
URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo
echo "✅ Eva is live at: $URL"
