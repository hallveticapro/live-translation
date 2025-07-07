import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import { HiOutlineMicrophone, HiOutlineXCircle } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMic() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState([]);

  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => console.log("WS connected"));
    return () => socket.off("connect");
  }, []);

  const startVisualizer = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const bar = document.getElementById("meter");

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      const peak = Math.max(...data) - 128;
      const scale = 1 + peak / 80;
      if (bar) bar.style.transform = `scaleX(${scale})`;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const bar = document.getElementById("meter");
    if (bar) bar.style.transform = "scaleX(1)";
  };

  const startNewRecorder = () => {
    const stream = streamRef.current;
    if (!stream || !recordingRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    if (!mimeType) {
      console.error("❌ No supported MediaRecorder MIME type available.");
      setStatus("❌ unsupported format");
      return;
    }

    const rec = new MediaRecorder(stream, { mimeType });

    rec.ondataavailable = async (e) => {
      if (e.data.size === 0) return;

      const form = new FormData();
      form.append("file", e.data, "chunk.webm");
      setStatus("⬆️ uploading…");

      try {
        const res = await fetch(
          `${window.__CONFIG__?.API_BASE_URL}/api/transcribe`,
          {
            method: "POST",
            body: form,
          }
        );
        if (!res.ok) throw new Error("Upload failed");
        setStatus("🎤 recording…");
      } catch (err) {
        console.error(err);
        setStatus("❌ upload failed");
      }
    };

    rec.onstop = () => {
      if (recordingRef.current) startNewRecorder();
    };

    rec.onerror = (e) => {
      console.error("MediaRecorder error:", e.error);
      setStatus("❌ recorder error");
    };

    rec.start();
    recorderRef.current = rec;
    setStatus("🎤 recording…");
    setTimeout(() => {
      if (rec.state !== "inactive") rec.stop();
    }, 3000);
  };

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      recordingRef.current = true;
      startVisualizer();
      setRecording(true);
      startNewRecorder();
    } catch (err) {
      console.error(err);
      setStatus("❌ mic error");
    }
  };

  const handleStop = () => {
    recordingRef.current = false;
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopVisualizer();
    setRecording(false);
    setStatus("Stopped");
  };

  useEffect(() => {
    const handler = (p) => {
      if (p.lang === "en") {
        setLogs((cur) => [...cur, p].slice(-50));
      }
    };
    socket.on("broadcast:caption", handler);
    return () => socket.off("broadcast:caption", handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [logs]);

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      {/* Log feed */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 overflow-y-auto flex flex-col justify-end pb-20">
        <AnimatePresence initial={false}>
          {logs.map((m, i) => (
            <motion.p
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className={`text-2xl my-2 text-center break-words ${
                i === logs.length - 1 ? "text-white" : "text-gray-400"
              }`}
            >
              {m.text}
            </motion.p>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Pill footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/90 dark:bg-gray-700/90 backdrop-blur-sm text-white rounded-full shadow-lg flex items-center gap-4 px-6 py-2">
        {/* Mic toggle */}
        <button
          onClick={recording ? handleStop : handleStart}
          className="p-1 rounded hover:bg-white/10 text-xl"
        >
          {recording ? <HiOutlineXCircle /> : <HiOutlineMicrophone />}
        </button>

        {/* Status */}
        <span className="text-sm">{status}</span>

        {/* Voice meter */}
        <div
          id="meter"
          className="h-2 w-24 bg-green-500 origin-left transition-transform rounded"
        ></div>
      </div>
    </div>
  );
}
