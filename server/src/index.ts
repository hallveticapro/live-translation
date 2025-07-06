import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

/* === Config ================================================================= */

const PORT       = Number(process.env.PORT)        || 3000;
const CERTS_DIR  = process.env.CERTS_DIR           || path.join(process.env.HOME!, "code/certs");
const KEY_FILE   = process.env.TLS_KEY_FILENAME    || "localhost-key.pem";
const CERT_FILE  = process.env.TLS_CERT_FILENAME   || "localhost.pem";

/* === Express + HTTPS ======================================================== */

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_, res) => res.send("OK"));

const server = https.createServer(
  {
    key:  fs.readFileSync(path.join(CERTS_DIR, KEY_FILE)),
    cert: fs.readFileSync(path.join(CERTS_DIR, CERT_FILE)),
  },
  app
);

/* === Socket.IO ============================================================== */

const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  console.log("🔌  socket connected", socket.id);
  socket.on("disconnect", () => console.log("socket disconnected", socket.id));
});

/* === Boot =================================================================== */

server.listen(PORT, () => {
  console.log(`🚀  Server listening on https://localhost:${PORT}`);
});
