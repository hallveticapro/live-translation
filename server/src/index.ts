/* === server/src/index.ts =============================================== */

import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import { randomUUID } from "node:crypto";

import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";

import busboy from "busboy";
import fetch from "node-fetch";
import { FormData, File } from "formdata-node";
const { translate } = require("@vitalets/google-translate-api");

dotenv.config({ path: path.join(process.cwd(), ".env") });

/* --- Config ------------------------------------------------------------- */
const PORT = Number(process.env.PORT) || 3000;
const CERTS_DIR =
  process.env.CERTS_DIR || path.join(process.env.HOME || "", "code/certs");
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const TARGET_LANGS = (process.env.TARGET_LANGS || "es,pt")
  .split(",")
  .map((s) => s.trim().toLowerCase());

/* --- Express + HTTPS ---------------------------------------------------- */
const app = express();
app.use(cors());
app.get("/healthz", (_req, res) => {
  res.send("OK");
});

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(CERTS_DIR, "localhost-key.pem")),
    cert: fs.readFileSync(path.join(CERTS_DIR, "localhost.pem")),
  },
  app
);

/* --- WebSocket ---------------------------------------------------------- */
interface Caption {
  id: string;
  text: string;
  lang: string;
  timestamp: number;
}
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("live:setLang", (lang: string) => {
    TARGET_LANGS.forEach((l) => socket.leave(l));
    socket.join(lang);
  });
});

/* --- /api/transcribe ---------------------------------------------------- */
app.post("/api/transcribe", (req, res) => {
  const bb = busboy({ headers: req.headers });
  const chunks: Buffer[] = [];

  bb.on("file", (_name, file) => file.on("data", (d) => chunks.push(d)));

  bb.on("finish", async () => {
    try {
      const audio = Buffer.concat(chunks);

      /* 1. Groq Whisper */
      const form = new FormData();
      const file = new File([audio], "chunk.webm", {
        type: "audio/webm;codecs=opus",
      });
      form.set("file", file);
      form.set("model", "whisper-large-v3");
      form.set("response_format", "json");
      form.set("language", "en");

      const whisperRes = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_KEY}` },
          body: form as any,
        }
      );
      const whisperJson = await whisperRes.json();
      console.log(
        "[Whisper]",
        whisperRes.status,
        JSON.stringify(whisperJson).slice(0, 120)
      );

      const transcript: string | undefined = (whisperJson as any).text?.trim();
      if (!transcript) throw new Error("Empty transcript");

      /* 2. Translate */
      const translations = await Promise.all(
        TARGET_LANGS.map(async (lang) => {
          const tr = await translate(transcript, { to: lang });
          return { lang, text: tr.text };
        })
      );

      /* 3. Broadcast */
      const idBase = randomUUID();
      const ts = Date.now();
      translations.forEach((t) =>
        io.to(t.lang).emit("broadcast:caption", {
          id: `${idBase}-${t.lang}`,
          text: t.text,
          lang: t.lang,
          timestamp: ts,
        } as Caption)
      );

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Transcription failed" });
    }
  });

  req.pipe(bb);
});

/* --- Boot --------------------------------------------------------------- */
server.listen(PORT, () =>
  console.log(`🚀  Server listening on https://localhost:${PORT}`)
);
