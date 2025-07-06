/* # file: client/src/pages/LiveFeed.jsx */
import { useEffect, useState } from "react";
import { socket } from "../lib/socket";

const getLang = () =>
  localStorage.getItem("lang") ||
  prompt("Enter language code (e.g., es, pt):")?.trim().toLowerCase() ||
  "es";

export default function LiveFeed() {
  const [lang, setLang] = useState(getLang);
  const [messages, setMessages] = useState([]);

  // on mount: join room
  useEffect(() => {
    socket.emit("live:setLang", lang);
  }, [lang]);

  // receive captions
  useEffect(() => {
    function handle(payload) {
      if (payload.lang !== lang) return;
      setMessages((m) => [...m.slice(-49), payload]);
    }
    socket.on("broadcast:caption", handle);
    return () => socket.off("broadcast:caption", handle);
  }, [lang]);

  return (
    <main className="min-h-screen flex flex-col items-center pt-10 bg-slate-100">
      <h1 className="text-3xl font-bold mb-2">/live ({lang})</h1>
      <button
        onClick={() => {
          const newLang =
            prompt("Language code:", lang)?.trim().toLowerCase() || lang;
          localStorage.setItem("lang", newLang);
          setLang(newLang);
          socket.emit("live:setLang", newLang);
        }}
        className="mb-4 text-blue-600 underline"
      >
        Change language
      </button>
      <section className="flex flex-col gap-2 w-full max-w-xl px-4">
        {messages.map((m) => (
          <p key={m.id} className="text-lg bg-white p-2 rounded shadow">
            {m.text}
          </p>
        ))}
      </section>
    </main>
  );
}
