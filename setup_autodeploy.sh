#!/usr/bin/env bash
set -euo pipefail

# -------- Config (you can override via env) ----------
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-eva}"
REPO="${REPO:-eva-reg}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"
BRANCH="${BRANCH:-main}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
GITHUB_REPO="${GITHUB_REPO:-}"

echo "Project:  $PROJECT_ID  ($PROJECT_NUMBER)"
echo "Region:   $REGION"
echo "Service:  $SERVICE"
echo "Repo:     $REPO"
echo "Branch:   $BRANCH"
echo "Trigger:  $TRIGGER_NAME"
echo "GitHub:   ${GITHUB_OWNER:-<not set>}/${GITHUB_REPO:-<not set>}"
echo "-----------------------------------------------------"

# -------- Ensure app folder and create cloudbuild.yaml ----------
mkdir -p ~/eva && cd ~/eva

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
  args: [
    'run','deploy','\${_SERVICE}',
    '--image','\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA',
    '--region','\${_REGION}','--platform','managed','--allow-unauthenticated',
    '--cpu','1','--memory','512Mi','--min-instances','0','--max-instances','3','--concurrency','80'
  ]

images:
- '\${_REGION}-docker.pkg.dev/$PROJECT_ID/\${_REPO}/\${_SERVICE}:\$SHORT_SHA'
YAML

echo "✅ Wrote ~/eva/cloudbuild.yaml"

# -------- Enable services (idempotent) ----------
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# -------- Create Artifact Registry repo if needed ----------
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker --location="$REGION" \
  --description="Eva container images" \
  >/dev/null 2>&1 || echo "Repo $REPO already exists."

# -------- Ensure Cloud Build service identity exists ----------
gcloud beta services identity create --service=cloudbuild.googleapis.com --project="$PROJECT_ID" >/dev/null 2>&1 || true

CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# -------- Grant roles to Cloud Build ----------
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" --role="roles/run.admin" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" --role="roles/iam.serviceAccountUser" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" --role="roles/artifactregistry.writer" >/dev/null

echo "✅ Cloud Build service account permissions set."

# -------- Create GitHub trigger if repo is provided ----------
CREATE_CMD=(gcloud beta builds triggers create github
  --name="$TRIGGER_NAME"
  --repo-owner="${GITHUB_OWNER:-missing}"
  --repo-name="${GITHUB_REPO:-missing}"
  --branch-pattern="^${BRANCH}$"
  --build-config="cloudbuild.yaml"
  --project="$PROJECT_ID"
)

if [[ -n "${GITHUB_OWNER}" && -n "${GITHUB_REPO}" ]]; then
  echo "Attempting to create GitHub trigger..."
  if "${CREATE_CMD[@]}" >/dev/null 2>&1; then
    echo "✅ Trigger '$TRIGGER_NAME' created for ${GITHUB_OWNER}/${GITHUB_REPO} (branch: ${BRANCH})."
  else
    echo "⚠️  Could not create the trigger automatically."
    echo "   Likely cause: the Cloud Build GitHub App isn't connected to your repo yet."
    echo "   Please do this one-time click path:"
    echo "     Console → Cloud Build → Triggers → +Create Trigger → Connect repository → GitHub"
    echo "     Authorize the Google Cloud Build app for ${GITHUB_OWNER}/${GITHUB_REPO}."
    echo "   Then run this command to create the trigger:"
    printf "     %q " "${CREATE_CMD[@]}"; echo
  fi
else
  echo "ℹ️  Skipped trigger creation (GITHUB_OWNER/GITHUB_REPO not set)."
  echo "    After connecting your repo, run this to create the trigger:"
  printf "    %q " "${CREATE_CMD[@]}"; echo
fi

echo
echo "🎯 Done. Push to '${BRANCH}' will auto-build and deploy Eva once the trigger is connected."
echo "   Watch builds in: Console → Cloud Build → History."
