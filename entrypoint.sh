#!/bin/sh

# Substitute runtime env var into config.js
envsubst < /app/client_dist/config.template.js > /app/client_dist/config.js

# Run the Node server
exec node /app/server/dist/index.js
