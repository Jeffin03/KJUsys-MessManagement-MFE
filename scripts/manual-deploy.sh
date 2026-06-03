#!/bin/bash

UI_DIR="/data/Apps/ui/kjusys-ui"
TEMP_DIR="/home/ubuntu/temp/kjusys-ui"
CLEANUP_LOG="/var/log/kjsuys/chunk-cleanup-logs/kjusys-chunk-cleanup.log"

echo -e "##################################### Running UI Deployment #####################################"

echo -e "\nStopping Services and Killing Tasks..........................................................."
sudo supervisorctl stop kjusysuirunner_script || true
for port in {4200..4215} 4217 4219 4220 4221; do
  sudo fuser -k "${port}/tcp" || true
done

echo -e "\nRemoving old project source and config files (dist preserved for stale-chunk safety)........."
sudo rm -rf "${UI_DIR}/projects"
sudo rm -f "${UI_DIR}/package.json" "${UI_DIR}/angular.json" "${UI_DIR}/package-lock.json"

echo -e "\nExtracting new build artifact................................................................."
cd /home/ubuntu/temp/
sudo unzip -o kjusys-ui.zip

echo -e "\nMerging new dist over existing (preserving old hashed chunks for active sessions)............."
# rsync merges new files over old: overwrites index.html/remoteEntry.js/version.json,
# adds new hashed chunks, but leaves old hashed chunks in place so stale browser
# sessions can still load them during the 90-minute grace period.
# On first deploy (no existing dist), rsync creates the directory automatically.
sudo rsync -a "${TEMP_DIR}/dist/" "${UI_DIR}/dist/"

echo -e "\nCopying project source........................................................................"
sudo cp -R "${TEMP_DIR}/projects" "${UI_DIR}/"
sudo cp "${TEMP_DIR}/package.json" "${UI_DIR}/"
sudo cp "${TEMP_DIR}/angular.json" "${UI_DIR}/"

sudo chown -R ubuntu:ubuntu "${UI_DIR}/"

echo -e "\nInstalling npm..............................................................................."
cd "${UI_DIR}"
npm install --omit=dev --no-audit --no-fund

echo -e "\nChanging permissions of UI folder..........................................................."
sudo chown -R angularuiuser:angularuiuser "${UI_DIR}/"

echo -e "\nClearing Temp Folder........................................................................"
sudo rm -rf "${TEMP_DIR}"

echo -e "\nStarting Services............................................................................"
sudo supervisorctl start kjusysuirunner_script

echo -e "\nSpawning orphaned chunk cleanup in background (grace period: 90 min)........................"
# Expects cleanup-old-chunks.js at ${UI_DIR}/scripts/ — place it there manually on first use.
# CI will overwrite it automatically once prod CI is implemented.
mkdir -p "$(dirname "${CLEANUP_LOG}")"
nohup node "${UI_DIR}/scripts/cleanup-old-chunks.js" "${UI_DIR}/dist" 5400 \
  >> "${CLEANUP_LOG}" 2>&1 &

echo -e "\nDone ✓"
