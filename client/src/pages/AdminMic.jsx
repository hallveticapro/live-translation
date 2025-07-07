/* client/src/pages/AdminMic.jsx */
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

export default function AdminMic() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Idle");

  const streamRef = useRef(null); // active MediaStream
  const analyserRef = useRef(null); // Audio analyser for meter
  const rafRef = useRef(null); // requestAnimationFrame id
  const recorderRef = useRef(null); // current MediaRecorder
  const restartRef = useRef(null); // setTimeout id for 9-s restart

  /* --- Socket debug ---------------------------------------------------- */
  useEffect(() => {
    socket.on("connect", () => console.log("WS connected"));
    return () => socket.off("connect");
  }, []);

  /* --- Meter helpers --------------------------------------------------- */
  const startVisualizer = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const bar = document.getElementById("meter");

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      const peak = Math.max(...data) - 128;
      const scale = 1 + peak / 80; // tweak 80 for sensitivity
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

  /* --- Core: start a fresh recorder every 9 s -------------------------- */
  const startNewRecorder = () => {
    const stream = streamRef.current;
    if (!stream) return;

    const rec = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    rec.ondataavailable = async (e) => {
      if (e.data.size === 0) return;
      const form = new FormData();
      form.append("file", e.data, "chunk.webm");

      setStatus("⬆️ uploading…");
      try {
        await fetch("https://localhost:3000/api/transcribe", {
          method: "POST",
          body: form,
        });
      } catch (err) {
        console.error(err);
        setStatus("❌ upload failed");
      }
      setStatus("🎤 recording…");
    };

    rec.onstop = () => {
      // schedule a replacement recorder immediately
      restartRef.current = setTimeout(startNewRecorder, 0);
    };

    rec.start(); // begin recording
    recorderRef.current = rec;
    setStatus("🎤 recording…");

    // stop this recorder after 9 s to flush a complete container
    restartRef.current = setTimeout(() => rec.stop(), 3000);
  };

  /* --- UI handlers ----------------------------------------------------- */
  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // analyser for meter
      const audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      startVisualizer();

      setRecording(true);
      startNewRecorder();
    } catch (err) {
      console.error(err);
      setStatus("❌ mic error");
    }
  };

  const handleStop = () => {
    if (restartRef.current) clearTimeout(restartRef.current);
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopVisualizer();
    setRecording(false);
    setStatus("Stopped");
  };

  /* --- Render ---------------------------------------------------------- */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Admin Mic Capture</h1>

      <p>{status}</p>
      <div
        id="meter"
        className="h-2 w-40 bg-green-500 origin-left transition-transform"
      ></div>

      {recording ? (
        <button
          onClick={handleStop}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleStart}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          Start
        </button>
      )}

      <a href="/" className="text-blue-600 underline">
        Back to Home
      </a>
    </main>
  );
}
