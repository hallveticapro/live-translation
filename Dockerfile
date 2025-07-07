# ------------ 1) Build React client ------------
FROM node:20-alpine AS client-builder

WORKDIR /app
COPY client/ ./client
RUN cd client \
  && npm ci \
  && npm run build          # outputs to client/dist

# ------------ 2) Install server deps -----------
FROM node:20-alpine AS server-builder

WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci

# ------------ 3) Final runtime image ----------
FROM node:20-alpine

WORKDIR /app

# copy server code & prod deps
COPY --from=server-builder /app/server /app/server
# copy front-end build
COPY --from=client-builder /app/client/dist /app/client_dist
# copy TLS certificates
COPY certs /app/certs

# set env so server picks up certs dir
ENV CERTS_DIR=/app/certs
ENV NODE_ENV=production
ENV PORT=3000

# expose HTTPS port
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
