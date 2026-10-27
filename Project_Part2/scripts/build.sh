#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cd frontend
npm ci --no-fund --no-audit
npm run lint
npm test
npm run build
cd ../backend
mvn -B -ntp clean verify
echo 'Built backend/target/fleetdesk.jar. Run it from the backend directory.'
