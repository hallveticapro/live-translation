/* # file: client/src/pages/LiveFeed.jsx */
import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export default function LiveFeed() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    function handleCaption(payload) {
      setMessages((m) => [...m.slice(-49), payload]); // keep last 50
    }
    socket.on("broadcast:caption", handleCaption);
    return () => socket.off("broadcast:caption", handleCaption);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center pt-10 bg-slate-100">
      <h1 className="text-3xl font-bold mb-6">/live Feed</h1>
      <section className="flex flex-col gap-2 w-full max-w-xl px-4">
        {messages.map((m) => (
          <p key={m.id} className="text-lg bg-white p-2 rounded shadow">
            {m.text}
          </p>
        ))}
      </section>
      <a href="/" className="mt-8 text-blue-600 underline">
        Back to Home
      </a>
    </main>
  );
}
