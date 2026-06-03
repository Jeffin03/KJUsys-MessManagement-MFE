#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STAGING_DIR="/data/codedeploy/kjusys-ui-deploy"
UI_DIR="/data/Apps/ui/kjusys-ui"
DEPLOY_USER="angularuiuser"
SUPERVISOR_PROGRAM="kjusysuirunner_script"

log() { echo "[$(date -Is)] [KJUSYS-UI] $*"; }

stop_services() {
  log "Stopping supervisor and killing processes..."
  sudo supervisorctl stop "${SUPERVISOR_PROGRAM}" || true
  for port in {4200..4215} 4217 4219 4220 4221
  do sudo fuser -k "${port}/tcp" || true; done
}

cleanup() {
  log "Removing old project source and config files (dist preserved for stale-chunk safety)..."
  sudo rm -rf "${UI_DIR}/projects"
  sudo rm -f "${UI_DIR}/package.json" "${UI_DIR}/angular.json" "${UI_DIR}/package-lock.json"
}

deploy_new() {
  log "Merging new dist over existing (preserving old hashed chunks for active sessions)..."
  cd "${STAGING_DIR}"
  sudo rsync -a "${STAGING_DIR}/dist/" "${UI_DIR}/dist/"
  sudo cp -R projects "${UI_DIR}/"
  sudo mkdir -p "${UI_DIR}/prod-server"
  sudo cp -Rf prod-server/* "${UI_DIR}/prod-server/"
  sudo cp package.json package-lock.json angular.json "${UI_DIR}/"
  sudo chown -R ubuntu:ubuntu "${UI_DIR}/"
  log "Installing npm dependencies..."
  cd "${UI_DIR}"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  export PATH=$PATH:/usr/local/bin:/usr/bin
  npm install --omit=dev
  sudo chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${UI_DIR}/"
  log "Clearing temp folder..."
  sudo rm -rf "${STAGING_DIR}"
}

start_services() {
  log "Starting supervisor..."
  sudo supervisorctl start "${SUPERVISOR_PROGRAM}"
  log "Spawning orphaned chunk cleanup in background (grace period: 90 min)..."
  nohup node "${UI_DIR}/scripts/cleanup-old-chunks.js" "${UI_DIR}/dist" 5400 \
    >> /var/log/kjusys-chunk-cleanup.log 2>&1 &
}

validate() {
  log "Checking supervisor..."
  sudo supervisorctl status "${SUPERVISOR_PROGRAM}" || true
}

main() {
  lifecycle="${LIFECYCLE_EVENT_NAME:-${LIFECYCLE_EVENT:-}}"
  lifecycle="$(printf '%s' "${lifecycle}" | tr -d '\r' | xargs || true)"
  log "Lifecycle event: ${lifecycle}"
  case "${lifecycle}" in
    ApplicationStop) stop_services ;;
    AfterInstall) cleanup; deploy_new ;;
    ApplicationStart) start_services ;;
    ValidateService) validate ;;
    *) log "Unknown event or no event, exiting 0."; exit 0 ;;
  esac
}
main "$@"
