import path from "node:path";
import fs from "node:fs";
import https from "node:https";

import express, { Request, Response } from "express"; // ✅ importing types here
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

/* === Config ================================================================= */

const PORT = Number(process.env.PORT) || 3000;
const CERTS_DIR =
  process.env.CERTS_DIR || path.join(process.env.HOME!, "code/certs");
const KEY_FILE = process.env.TLS_KEY_FILENAME || "localhost-key.pem";
const CERT_FILE = process.env.TLS_CERT_FILENAME || "localhost.pem";

/* === Express + HTTPS ======================================================== */

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_req: Request, res: Response) => {
  res.send("OK");
});

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(CERTS_DIR, KEY_FILE)),
    cert: fs.readFileSync(path.join(CERTS_DIR, CERT_FILE)),
  },
  app
);

/* === Socket.IO ============================================================== */

interface CaptionPayload {
  id: string;
  text: string;
  timestamp: number;
}

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("🔌 socket connected", socket.id);

  // Receive message from /admin and rebroadcast to all /live clients
  socket.on("admin:caption", (payload: CaptionPayload) => {
    io.emit("broadcast:caption", payload);
  });

  socket.on("disconnect", () => console.log("socket disconnected", socket.id));
});

/* === Boot =================================================================== */

server.listen(PORT, () => {
  console.log(`🚀  Server listening on https://localhost:${PORT}`);
});
