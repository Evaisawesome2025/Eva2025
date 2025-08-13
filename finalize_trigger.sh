#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="$(gcloud config get-value project)"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-eva}"
BRANCH="${BRANCH:-main}"
TRIGGER_NAME="${TRIGGER_NAME:-eva-autodeploy}"

read -rp "GitHub owner (username) [Evaisawesome2025]: " GITHUB_OWNER
GITHUB_OWNER="${GITHUB_OWNER:-Evaisawesome2025}"
read -rp "GitHub repo name [Eva2025]: " GITHUB_REPO
GITHUB_REPO="${GITHUB_REPO:-Eva2025}"

echo
echo "Project:     $PROJECT_ID"
echo "Repo:        ${GITHUB_OWNER}/${GITHUB_REPO}"
echo "Branch:      ${BRANCH}"
echo "Trigger:     ${TRIGGER_NAME}"
echo "Service:     ${SERVICE}"
echo

