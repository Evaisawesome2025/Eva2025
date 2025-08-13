#!/usr/bin/env bash
set -euo pipefail

# ================== YOU MAY EDIT THESE DEFAULTS ==================
DEFAULT_OWNER="Evaisawesome2025"
DEFAULT_REPO="Eva2025"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-eva}"
AR_REPO="${AR_REPO:-eva-reg}"        # Artifact Registry repository (Docker)
BRANCH="${BRANCH:-main}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"
# ================================================================

# ---- Project / environment ----
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Service:  $SERVICE"
echo "Branch:   $BRANCH"
echo "AR repo:  $AR_REPO"
echo "======================================================"

# ---- Ask once for GitHub owner/repo (with sensible defaults) ----
read -rp "GitHub owner/username [$DEFAULT_OWNER]: " GITHUB_OWNER
GITHUB_OWNER="${GITHUB_OWNER:-$DEFAULT_OWNER}"
read -rp "GitHub repo name     [$DEFAULT_REPO]: " GITHUB_REPO
GITHUB_REPO="${GITHUB_REPO:-$DEFAULT_REPO}"
GH_EMAIL="${GITHUB_OWNER}@users.noreply.github.com"

echo
echo "Using GitHub repo: ${GITHUB_OWNER}/${GITHUB_REPO}"
echo "======================================================"

# ---- App files (idempotent) ----
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
  _REPO: ${AR_REPO}
  _SERVICE: ${SERVICE}
steps:
- name: gcr.io/cloud-builders/docker
  args: ['build','-t','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA','.']
- name: gcr.io/cloud-builders/docker
  args: ['push','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA']
- name: gcr.io/google.com/cloudsdktool/cloud-sdk
  entrypoint: gcloud
  args: ['run','deploy','\${_SERVICE}',
         '--image','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA',
         '--region','\${_REGION}','--platform','managed','--allow-unauthenticated',
         '--cpu','1','--memory','512Mi','--min-instances','0','--max-instances','3','--concurrency','80']
images:
- '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA'
YAML

echo "✅ App & build files written."

# ---- Enable services ----
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# ---- Artifact Registry repo (create if missing) ----
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker --location="$REGION" \
  >/dev/null 2>&1 || echo "Repo $AR_REPO already exists."

# ---- Cloud Build service account + IAM ----
gcloud beta services identity create --service=cloudbuild.googleapis.com --project="$PROJECT_ID" >/dev/null 2>&1 || true
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$CB_SA" --role="$ROLE" >/dev/null || true
done
echo "✅ Cloud Build permissions ready."

# ---- GitHub token (accept from env GH_TOKEN or via nano) ----
if [[ -z "${GH_TOKEN:-}" ]]; then
  echo
  echo "A nano window will open. Paste your GitHub Personal Access Token (classic) with 'repo' scope,"
  echo "then press Ctrl+O, Enter to save, and Ctrl+X to exit."
  read -p "Press Enter to open nano..."
  nano /tmp/gh.token
  GH_TOKEN="$(tr -d '\r\n' </tmp/gh.token)"; rm -f /tmp/gh.token
fi
test -n "$GH_TOKEN" || { echo "No token captured; aborting."; exit 1; }

# ---- Ensure GitHub repo exists (create if missing) ----
echo -n "Checking GitHub repo ${GITHUB_OWNER}/${GITHUB_REPO}... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token ${GH_TOKEN}" \
                     https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO})
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "not found; creating."
  curl -s -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
       -d "{\"name\":\"${GITHUB_REPO}\"}" https://api.github.com/user/repos >/dev/null
else
  echo "exists."
fi

# ---- Commit & push (handles 'fetch first' rejections) ----
git config --global user.name "Glen"
git config --global user.email "$GH_EMAIL"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git init; fi
git checkout -B "$BRANCH"
git add .
git commit -m "Eva: Cloud Run setup" >/dev/null 2>&1 || true

git remote remove origin >/dev/null 2>&1 || true
git remote add origin "https://${GITHUB_OWNER}:${GH_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"

set +e
git push -u origin "$BRANCH"
PUSH_STATUS=$?
set -e
if [[ $PUSH_STATUS -ne 0 ]]; then
  echo "Remote has history; pulling and retrying..."
  git fetch origin "$BRANCH" || true
  git pull --rebase origin "$BRANCH" --allow-unrelated-histories || true
  git push -u origin "$BRANCH"
fi
# swap remote to tokenless URL
git remote set-url origin "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
echo "✅ Code pushed to GitHub."

# ---- One-time connect: GitHub → Cloud Build (requires a click) ----
CONNECT_URL="https://console.cloud.google.com/cloud-build/triggers/connect?project=${PROJECT_ID}"
echo
echo "🌐 Open & authorize the Google Cloud Build GitHub app for ${GITHUB_OWNER}/${GITHUB_REPO}:"
echo "    $CONNECT_URL"
( xdg-open "$CONNECT_URL" >/dev/null 2>&1 || open "$CONNECT_URL" >/dev/null 2>&1 || true )
echo "In the browser: choose GitHub, authorize/install **Google Cloud Build**, and select **${GITHUB_OWNER}/${GITHUB_REPO}**."
read -p "Press Enter AFTER the repo shows as Connected in Cloud Build..."

# ---- Create trigger (retry until connected) ----
create_trigger() {
  gcloud beta builds triggers create github \
    --name="$TRIGGER_NAME" \
    --repo-owner="$GITHUB_OWNER" \
    --repo-name="$GITHUB_REPO" \
    --branch-pattern="^${BRANCH}$" \
    --build-config="cloudbuild.yaml" \
    --project="$PROJECT_ID"
}
if gcloud beta builds triggers list --format='value(name)' | grep -qx "$TRIGGER_NAME"; then
  echo "Trigger '$TRIGGER_NAME' already exists."
else
  until create_trigger; do
    echo "⚠️  Trigger creation failed (likely repo not connected yet)."
    read -p "Fix the connection in the browser, then press Enter to retry..."
  done
fi

# ---- Kick off a test build ----
gcloud beta builds triggers run "$TRIGGER_NAME" --branch="$BRANCH" --project="$PROJECT_ID" || true
echo "🔎 Watch builds: https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"

# ---- Print Cloud Run URL ----
echo "🌍 Cloud Run URL:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)' || true

# Clean sensitive var
unset GH_TOKEN || true
