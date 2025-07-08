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
import type { Request, Response } from "express";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const PORT = Number(process.env.PORT) || 3000;
const defaultCerts = path.join(process.env.HOME || "", "code/certs");
const CERTS_DIR =
  process.env.CERTS_DIR && fs.existsSync(process.env.CERTS_DIR)
    ? process.env.CERTS_DIR
    : defaultCerts;

const GROQ_KEY = process.env.GROQ_API_KEY || "";
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || "";
const TARGET_LANGS = (process.env.TARGET_LANGS || "es,pt")
  .split(",")
  .map((s) => s.trim().toLowerCase());

const app = express();
const clientDist = path.join(process.cwd(), "client_dist");

app.use(cors());
app.use(express.static(clientDist));

app.get("/healthz", (_req: Request, res: Response) => {
  res.send("OK");
});

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(CERTS_DIR, "localhost-key.pem")),
    cert: fs.readFileSync(path.join(CERTS_DIR, "localhost.pem")),
  },
  app
);

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

async function mistralTranslate(text: string, target: string): Promise<string> {
  if (!text.trim()) return "-";

  const body = {
    model: "mistral-small",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a translation engine. Respond ONLY with the translated sentence. Do NOT add language names, notes, brackets, or parentheses. If the input is empty or has no translatable content, respond with a single dash (-).",
      },
      {
        role: "user",
        content: `Translate this sentence to ${target}:\n\`\`\`\n${text}\n\`\`\``,
      },
    ],
  };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral ${response.status}: ${errorText}`);
  }

  const json: any = await response.json();
  let output = json.choices[0].message.content.trim();

  output = output
    .split("\n")[0]
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();

  return output || "-";
}

interface WhisperResponse {
  text?: string;
  [key: string]: any;
}

app.post("/api/transcribe", (req, res) => {
  const bb = busboy({ headers: req.headers });
  const chunks: Buffer[] = [];

  bb.on("file", (_name, file) => file.on("data", (d) => chunks.push(d)));

  bb.on("finish", async () => {
    try {
      const audio = Buffer.concat(chunks);

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

      // 🛠 FIXED: assert type instead of declaring
      const whisperJson = (await whisperRes.json()) as WhisperResponse;

      console.log(
        "[Whisper]",
        whisperRes.status,
        JSON.stringify(whisperJson).slice(0, 120)
      );

      const transcript = whisperJson.text?.trim();
      if (!transcript) throw new Error("Empty transcript");

      const translations = await Promise.all(
        TARGET_LANGS.map(async (lang) => {
          const txt = await mistralTranslate(transcript, lang);
          return { lang, text: txt };
        })
      );

      const idBase = randomUUID();
      const ts = Date.now();

      /**
       * 1) Emit raw English
       */
      io.to("en").emit("broadcast:caption", {
        id: `${idBase}-en`,
        text: transcript,
        lang: "en",
        timestamp: ts,
      } as Caption);

      /**
       * 2) Emit translated languages (es, pt, …)
       */
      for (const lang of TARGET_LANGS) {
        try {
          const translated = await mistralTranslate(transcript, lang);
          io.to(lang).emit("broadcast:caption", {
            id: `${idBase}-${lang}`,
            text: translated,
            lang,
            timestamp: ts,
          } as Caption);
        } catch (err) {
          console.error(`[Translate:${lang}]`, err);
        }
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  req.pipe(bb);
});

import type { RequestHandler } from "express";

/** Serve index.html for any unmatched route (SPA fallback) */
const spaHandler: RequestHandler = (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
};

app.use(spaHandler); // <— no path string, so it catches everything

server.listen(PORT, () =>
  console.log(`🚀 Server listening on https://localhost:${PORT}`)
);
