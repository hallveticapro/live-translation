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

# ✅ NOW copy everything else (so .env isn't overwritten)
COPY client .

# ✅ Now run the build with the env injected
RUN npm run build

################ 3) Final runtime image #########################################
FROM node:20-alpine

WORKDIR /app

# ------------- copy build artifacts -------------
COPY --from=server-builder /app/server /app/server
COPY --from=client-builder /app/client/dist /app/client_dist

# ------------- generate self-signed certs -------
RUN apk add --no-cache openssl && \
  mkdir /app/certs && \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /app/certs/localhost-key.pem \
  -out   /app/certs/localhost.pem \
  -subj "/CN=localhost"

ENV CERTS_DIR=/app/certs
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
CMD ["sh", "-c", "echo 'window.__CONFIG__ = { API_BASE_URL: \"${API_BASE_URL}\" };' > /app/client_dist/config.js && node server/dist/index.js"]