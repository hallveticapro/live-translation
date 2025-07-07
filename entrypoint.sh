#!/bin/sh

echo "[entrypoint] API_BASE_URL is: ${API_BASE_URL}"

# Replace placeholders in config.template.js with real env var
envsubst < /app/client_dist/config.template.js > /app/client_dist/config.js

# Run your server
exec node /app/server/dist/index.js