#!/usr/bin/env bash
set -euo pipefail

# ---- Inputs ----
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
echo "----------------------------------------------"

mkdir -p ~/eva && cd ~/eva

# ---- cloudbuild.yaml (idempotent; overwrite with our known-good file) ----
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

# ---- Enable services ----
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# ---- Ensure Artifact Registry repo ----
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker --location="$REGION" \
  --description="Eva container images" \
  >/dev/null 2>&1 || echo "Repo $REPO already exists."

# ---- Ensure Cloud Build service account + roles ----
gcloud beta services identity create --service=cloudbuild.googleapis.com --project="$PROJECT_ID" >/dev/null 2>&1 || true
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="roles/run.admin" >/dev/null || true
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="roles/iam.serviceAccountUser" >/dev/null || true
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$CB_SA" --role="roles/artifactregistry.writer" >/dev/null || true
echo "✅ Cloud Build permissions verified."

# ---- Require GitHub repo info ----
if [[ -z "$GITHUB_OWNER" || -z "$GITHUB_REPO" ]]; then
  echo "❗ Set GITHUB_OWNER and GITHUB_REPO env vars, e.g.:"
  echo "   export GITHUB_OWNER='your-github-username'"
  echo "   export GITHUB_REPO='your-repo-name'"
  exit 1
fi

# ---- Open Connect Repository page (one-time GitHub App install) ----
CONNECT_URL="https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
echo "🌐 Opening GitHub connect page:"
echo "   $CONNECT_URL"
( command -v xdg-open >/dev/null && xdg-open "$CONNECT_URL" ) >/dev/null 2>&1 || true
( command -v open >/dev/null && open "$CONNECT_URL" ) >/dev/null 2>&1 || true
echo "➡️  In the browser: choose GitHub, authorize/install the Google Cloud Build app,"
echo "   and select ${GITHUB_OWNER}/${GITHUB_REPO} for this project."
read -p "Press Enter AFTER the repo is connected to continue..."

# ---- Create trigger ----
echo "Creating GitHub trigger '$TRIGGER_NAME' for ${GITHUB_OWNER}/${GITHUB_REPO} (branch: ${BRANCH})..."
gcloud beta builds triggers create github \
  --name="$TRIGGER_NAME" \
  --repo-owner="$GITHUB_OWNER" \
  --repo-name="$GITHUB_REPO" \
  --branch-pattern="^${BRANCH}$" \
  --build-config="cloudbuild.yaml" \
  --project="$PROJECT_ID" \
  >/dev/null
echo "✅ Trigger created."

# ---- Kick off a test run from the latest commit on the branch ----
echo "Triggering a test build from branch '${BRANCH}'..."
gcloud beta builds triggers run "$TRIGGER_NAME" --branch="$BRANCH" --project="$PROJECT_ID" >/dev/null || true

echo
echo "🎉 All set. Any push to '${BRANCH}' on ${GITHUB_OWNER}/${GITHUB_REPO} will auto-build and deploy Eva."
echo "🔎 Watch progress in Console → Cloud Build → History."
echo "🌍 Current service URL:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)' || true
