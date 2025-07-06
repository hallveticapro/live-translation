/* # file: client/src/pages/AdminEcho.jsx */
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";

export default function AdminEcho() {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("🔄 Connecting…");

  useEffect(() => {
    socket.on("connect", () => setStatus("✅ Connected"));
    socket.on("disconnect", () => setStatus("❌ Disconnected"));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  function handleSend() {
    const text = inputRef.current.value.trim();
    if (!text) return;
    const payload = { id: crypto.randomUUID(), text, timestamp: Date.now() };
    socket.emit("admin:caption", payload);
    inputRef.current.value = "";
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">/admin Echo Test</h1>
      <p>{status}</p>
      <input
        ref={inputRef}
        type="text"
        placeholder="Type a message…"
        className="border px-3 py-2 rounded w-80"
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Send to /live
      </button>
      <a href="/" className="text-blue-600 underline">
        Back to Home
      </a>
    </main>
  );
}
