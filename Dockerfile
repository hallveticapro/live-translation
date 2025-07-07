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

# ✅ Copy everything else *after* deps
COPY client .
RUN npm run build

# Final runtime image
FROM node:20-alpine

WORKDIR /app

# ------------- copy build artifacts -------------
COPY --from=server-builder /app/server /app/server
COPY --from=client-builder /app/client/dist /app/client_dist

# copy the template config
COPY client/config.template.js /app/client_dist/config.template.js

# ------------- generate self-signed certs -------
RUN apk add --no-cache openssl && \
  mkdir /app/certs && \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /app/certs/localhost-key.pem \
  -out   /app/certs/localhost.pem \
  -subj "/CN=localhost"

# Runtime ENV
ENV CERTS_DIR=/app/certs
ENV NODE_ENV=production
ENV PORT=3000
ENV API_BASE_URL=https://translate.ahall.dev

EXPOSE 3000

# ✅ Runtime inject env into config.js before boot
CMD sh -c 'envsubst < /app/client_dist/config.template.js > /app/client_dist/config.js && node server/dist/index.js'
