#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-eva}"
REPO="${REPO:-eva-reg}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"
BRANCH="${BRANCH:-main}"

echo "Project: $PROJECT_ID  ($PROJECT_NUMBER)"
echo "Region:  $REGION"
echo "Service: $SERVICE"
echo "Repo:    $REPO"
echo "Branch:  $BRANCH"
echo "Trigger: $TRIGGER_NAME"
echo "----------------------------------------------"

cd ~/eva

# --- Get your GitHub details interactively ---
read -rp "GitHub username (owner): " GITHUB_OWNER
read -rp "GitHub repo name (must exist on GitHub): " GITHUB_REPO
read -rp "Your GitHub email (for git commits): " GITHUB_EMAIL

# --- Configure git identity (fixes the 'Please tell me who you are' error) ---
git config --global user.name "Glen"
git config --global user.email "$GITHUB_EMAIL"

# --- Initialize repo and make sure we have a commit on the branch ---
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
fi
git checkout -B "$BRANCH"
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git add .
  git commit -m "Eva: initial Cloud Run setup"
fi

# --- Add or update the GitHub remote ---
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
else
  git remote add origin "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
fi

echo "Pushing to GitHub... (If prompted for password, paste a GitHub Personal Access Token with 'repo' scope.)"
git push -u origin "$BRANCH"

# --- Ensure Cloud Build is connected to your GitHub repo (one-time) ---
CONNECT_URL="https://console.cloud.google.com/cloud-build/triggers/connect?project=${PROJECT_ID}"
echo
echo "Open this to connect the repo to Cloud Build (if not already connected):"
echo "  $CONNECT_URL"
( command -v xdg-open >/dev/null && xdg-open "$CONNECT_URL" ) >/dev/null 2>&1 || true
( command -v open >/dev/null && open "$CONNECT_URL" ) >/dev/null 2>&1 || true
echo "In the browser: choose GitHub, authorize/install the Google Cloud Build app,"
echo "and select ${GITHUB_OWNER}/${GITHUB_REPO} for this project."
read -p "Press Enter AFTER the repo is connected to continue..."

# --- Create the Cloud Build trigger for auto-deploy ---
gcloud beta builds triggers create github \
  --name="$TRIGGER_NAME" \
  --repo-owner="$GITHUB_OWNER" \
  --repo-name="$GITHUB_REPO" \
  --branch-pattern="^${BRANCH}$" \
  --build-config="cloudbuild.yaml" \
  --project="$PROJECT_ID"

# --- Kick off a test build ---
gcloud beta builds triggers run "$TRIGGER_NAME" --branch="$BRANCH" --project="$PROJECT_ID"

echo
echo "🎉 Auto-deploy is set. Every push to '${BRANCH}' on ${GITHUB_OWNER}/${GITHUB_REPO} will rebuild and deploy Eva."
echo "🔎 Watch builds in Console → Cloud Build → History."
echo "🌍 Current service URL:"
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)' || true
