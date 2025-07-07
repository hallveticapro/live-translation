# First stage: server builder
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server .
RUN npm run build

# Second stage: client builder
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

# Copy everything else, including config template
COPY client .

# Build client (config.template.js should be in place)
RUN npm run build

################ 3) Final runtime image #########################################
FROM node:20-alpine

WORKDIR /app

# ✅ Install dependencies needed for runtime + envsubst
RUN apk add --no-cache openssl gettext

# Copy build artifacts
COPY --from=server-builder /app/server /app/server
COPY --from=client-builder /app/client/dist /app/client_dist

# Copy config template + entrypoint script
COPY client/public/config.template.js /app/client_dist/config.template.js
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Generate self-signed certs
RUN mkdir /app/certs && \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /app/certs/localhost-key.pem \
  -out   /app/certs/localhost.pem \
  -subj "/CN=localhost"

ENV CERTS_DIR=/app/certs
ENV NODE_ENV=production
ENV PORT=3000
ENV API_BASE_URL=https://translate.ahall.dev

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
