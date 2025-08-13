#!/usr/bin/env bash
set -euo pipefail

# ==== EDIT THESE TWO LINES IF YOU WANT A DIFFERENT REPO ====
GITHUB_OWNER="Evaisawesome2025"
GITHUB_REPO="Eva2025"
# ===========================================================

PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-eva}"
REPO="${REPO:-eva-reg}"
BRANCH="${BRANCH:-main}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"

echo "Project: $PROJECT_ID  Region: $REGION  Service: $SERVICE  Branch: $BRANCH"
echo "GitHub:  $GITHUB_OWNER/$GITHUB_REPO"
mkdir -p ~/eva && cd ~/eva

# ---- App files (idempotent) ----
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

cat > requirements.txt <<'REQ'
fastapi
uvicorn[standard]
gunicorn
REQ

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

c

PY

cat > eva_finish.sh <<'EOS'
#!/usr/bin/env bash
set -euo pipefail
GITHUB_OWNER="Evaisawesome2025"
GITHUB_REPO="Eva2025"

PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REGION="${REGION:-us-central1}" ; SERVICE="${SERVICE:-eva}"
REPO="${REPO:-eva-reg}" ; BRANCH="${BRANCH:-main}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"

mkdir -p ~/eva && cd ~/eva

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

cat > requirements.txt <<'REQ'
fastapi
uvicorn[standard]
gunicorn
REQ

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

cat > cloudbuild.yaml <<YAML
substitutions:
  _REGION: ${REGION}
  _REPO: ${REPO}
  _SERVICE: ${SERVICE}
steps:
- name: gcr.io/cloud-builders/docker
  args: ['build','-t','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA','.']
- name: gcr.io/cloud-builders/docker
  args: ['push','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA']
- name: gcr.io/google.com/cloudsdktool/cloud-sdk
  entrypoint: gcloud
  args: ['run','deploy','\${_SERVICE}','--image','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA',
         '--region','\${_REGION}','--platform','managed','--allow-unauthenticated',
         '--cpu','1','--memory','512Mi','--min-instances','0','--max-instances','3','--concurrency','80']
images:
- '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA'
YAML

gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" >/dev/null 2>&1 || true
gcloud beta services identity create --service=cloudbuild.googleapis.com --project="$PROJECT_ID" >/dev/null 2>&1 || true
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="$ROLE" >/dev/null || true
done

echo
echo "A nano window will open. Paste your GitHub Personal Access Token (repo scope),"
echo "Ctrl+O, Enter to save, then Ctrl+X to exit."
read -p "Press Enter to open nano..."
nano /tmp/gh.token
GH_TOKEN="$(tr -d '\r\n' </tmp/gh.token)"; rm -f /tmp/gh.token
test -n "$GH_TOKEN" || { echo "No token captured; aborting."; exit 1; }

echo -n "Checking GitHub repo ${GITHUB_OWNER}/${GITHUB_REPO}... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO})
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "not found; creating."
  curl -s -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
       -d "{\"name\":\"${GITHUB_REPO}\"}" https://api.github.com/user/repos >/dev/null
else
  echo "exists."
fi

git config --global user.name "Glen"
git config --global user.email "${GITHUB_OWNER}@u_

cat > eva_finish.sh <<'EOS'
#!/usr/bin/env bash
set -euo pipefail
GITHUB_OWNER="Evaisawesome2025"
GITHUB_REPO="Eva2025"

PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REGION="${REGION:-us-central1}" ; SERVICE="${SERVICE:-eva}"
REPO="${REPO:-eva-reg}" ; BRANCH="${BRANCH:-main}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"

mkdir -p ~/eva && cd ~/eva

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

cat > requirements.txt <<'REQ'
fastapi
uvicorn[standard]
gunicorn
REQ

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

cat > cloudbuild.yaml <<YAML
substitutions:
  _REGION: ${REGION}
  _REPO: ${REPO}
  _SERVICE: ${SERVICE}
steps:
- name: gcr.io/cloud-builders/docker
  args: ['build','-t','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA','.']
- name: gcr.io/cloud-builders/docker
  args: ['push','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA']
- name: gcr.io/google.com/cloudsdktool/cloud-sdk
  entrypoint: gcloud
  args: ['run','deploy','\${_SERVICE}','--image','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA',
         '--region','\${_REGION}','--platform','managed','--allow-unauthenticated',
         '--cpu','1','--memory','512Mi','--min-instances','0','--max-instances','3','--concurrency','80']
images:
- '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA'
YAML

gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" >/dev/null 2>&1 || true
gcloud beta services identity create --service=cloudbuild.googleapis.com --project="$PROJECT_ID" >/dev/null 2>&1 || true
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="$ROLE" >/dev/null || true
done

echo
echo "A nano window will open. Paste your GitHub Personal Access Token (repo scope),"
echo "Ctrl+O, Enter to save, then Ctrl+X to exit."
read -p "Press Enter to open nano..."
nano /tmp/gh.token
GH_TOKEN="$(tr -d '\r\n' </tmp/gh.token)"; rm -f /tmp/gh.token
test -n "$GH_TOKEN" || { echo "No token captured; aborting."; exit 1; }

echo -n "Checking GitHub repo ${GITHUB_OWNER}/${GITHUB_REPO}... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO})
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "not found; creating."
  curl -s -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
       -d "{\"name\":\"${GITHUB_REPO}\"}" https://api.github.com/user/repos >/dev/null
else
  echo "exists."
fi

git config --global user.name "Glen"
git config --global user.email "${GITHUB_OWNER}@users.noreply.github.com"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git init; fi
git checkout -B "$BRANCH"
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then git add .; git commit -m "Eva: initial Cloud Run setup"; fi
git remote remove origin >/dev/null 2>&1 || true
git remote add origin "https://${GITHUB_OWNER}:${GH_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
git push -u origin "$BRANCH"
git remote set-url origin "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"

CONNECT_URL="https://console.cloud.google.com/cloud-build/triggers/connect?project=${PROJECT_ID}"
echo "Open and authorize the GitHub app for ${GITHUB_OWNER}/${GITHUB_REPO}:"
echo "  $CONNECT_URL"
( command -v xdg-open >/dev/null && xdg-open "$CONNECT_URL" ) >/dev/null 2>&1 || true
( command -v open >/dev/null && open "$CONNECT_URL" ) >/dev/null 2>&1 || true
read -p "Press Enter AFTER the repo is connected to continue..."

if ! gcloud beta builds triggers list --format='value(name)' | grep -qx "eva-autodeploy"; then
  gcloud beta builds triggers create github \
    --name="eva-autodeploy" \
    --repo-owner="$GITHUB_OWNER" \
    --repo-name="$GITHUB_REPO" \
    --branch-pattern="^$BRANCH$" \
    --build-config="cloudbuild.yaml" \
    --project="$PROJECT_ID"
fi

gcloud beta builds triggers run "eva-autodeploy" --branch="$BRANCH" --project="$PROJECT_ID" || true
echo "🎉 Auto-deploy configured. Watch builds in Cloud Build → History."
echo "Cloud Run URL:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)' || true
