################ 1) Build client ################################################
# ... (client-builder stage unchanged)

################ 2) Build server ################################################
# ... (server-builder stage unchanged)

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
