/* # file: client/src/pages/AdminMicTest.jsx */
import { useEffect, useState } from "react";

export default function AdminMicTest() {
  const [status, setStatus] = useState("⌛ Requesting mic…");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setStatus("✅ Microphone access granted!");
        // Immediately stop all tracks—we’re just testing permission
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch((err) => {
        console.error(err);
        setStatus(
          `❌ Mic denied (${err.name}). Check browser settings and HTTPS.`
        );
      });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-100">
      <h1 className="text-3xl font-bold">Admin Mic Test</h1>
      <p className="text-xl">{status}</p>
      <a href="/" className="text-blue-600 underline">
        Back to Home
      </a>
    </main>
  );
}
