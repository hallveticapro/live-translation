import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import useDarkMode from "../hooks/useDarkMode";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";

const LANGS = [
  { code: "en", label: "English (US)", emoji: "🇺🇸" },
  { code: "es", label: "Spanish (Latin America)", emoji: "🇻🇪" },
  { code: "pt", label: "Portuguese (Brazil)", emoji: "🇧🇷" },
];

export default function LiveFeed() {
  const [dark, setDark] = useDarkMode();
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const [showLang, setShowLang] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("live:setLang", lang);
  }, [lang]);

  useEffect(() => {
    const h = (p) => {
      if (p.lang !== lang) return;
      setMessages((m) => [...m.slice(-99), p]);
    };
    socket.on("broadcast:caption", h);
    return () => socket.off("broadcast:caption", h);
  }, [lang]);

  const pickLang = (c) => {
    localStorage.setItem("lang", c);
    setLang(c);
    setShowLang(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-10">
      {/* captions */}
      <div className="flex-1 w-full max-w-3xl px-4 overflow-y-auto">
        {messages.map((m) => (
          <p key={m.id} className="text-2xl mb-4 text-center break-words">
            {m.text}
          </p>
        ))}
      </div>

      {/* pill footer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/90 dark:bg-gray-700/90 text-white rounded-full shadow-lg flex items-center gap-4 px-6 py-2 backdrop-blur-sm">
        {/* label */}
        <span className="font-semibold whitespace-nowrap">
          Mr. Hall&rsquo;s Class
        </span>

        {/* language selector */}
        <div className="relative">
          <button
            aria-label="Language"
            onClick={() => setShowLang((s) => !s)}
            className="p-2 rounded hover:bg-white/10 text-xl"
          >
            {LANGS.find((l) => l.code === lang)?.emoji || "🏳️"}
          </button>

          {showLang && (
            <ul className="absolute -top-2 right-0 translate-y-[-100%] bg-gray-800 dark:bg-gray-700 border border-gray-600 rounded-xl overflow-hidden shadow-lg z-50">
              {LANGS.map((l) => (
                <li key={l.code}>
                  <button
                    onClick={() => pickLang(l.code)}
                    className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-700 text-white ${
                      l.code === lang ? "font-bold" : ""
                    }`}
                  >
                    <span className="text-xl">{l.emoji}</span> {l.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* theme toggle */}
        <button
          aria-label="Toggle theme"
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded hover:bg-white/10"
        >
          {dark ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
      </div>
    </div>
  );
}
