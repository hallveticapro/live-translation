/* client/src/pages/LiveFeed.jsx */

import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import useDarkMode from "../hooks/useDarkMode";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

const LANGS = [
  { code: "en", label: "English", emoji: "🇺🇸" },
  { code: "es", label: "Spanish (Latin America)", emoji: "🇻🇪" },
  { code: "pt", label: "Portuguese (Brazil)", emoji: "🇧🇷" },
];

export default function LiveFeed() {
  // Theme
  const [dark, setDark] = useDarkMode();

  // Language
  const defaultLang = "es";
  const storedLang = localStorage.getItem("lang");
  const validLang = LANGS.some((l) => l.code === storedLang)
    ? storedLang
    : defaultLang;
  const [lang, setLang] = useState(validLang);
  const [showLang, setShowLang] = useState(false);

  // Messages + scroll anchor
  const [msgs, setMsgs] = useState([]);
  const bottomRef = useRef(null);

  // 1) Join correct WS room
  useEffect(() => {
    socket.emit("live:setLang", lang);
  }, [lang]);

  // 2) Receive & append messages
  useEffect(() => {
    const handler = (p) => {
      if (p.lang !== lang) return;
      setMsgs((cur) =>
        [...cur, p]
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(-50)
      );
    };
    socket.on("broadcast:caption", handler);
    return () => void socket.off("broadcast:caption", handler);
  }, [lang]);

  // 3) Auto-scroll to bottom anchor
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [msgs]);

  // 4) Change language w/ toast
  const pickLang = (code) => {
    const match = LANGS.find((l) => l.code === code);
    if (!match) {
      toast.error(`Unsupported language code: ${code}`);
      return;
    }

    toast.success(`Language switched to ${match.label}!`);
    localStorage.setItem("lang", match.code);
    setLang(match.code);
    setShowLang(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      {/* Chat container */}
      <div
        id="feed"
        className="
          flex-1 w-full max-w-3xl mx-auto px-4 overflow-y-auto
          flex flex-col justify-end
          pb-18
        "
      >
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.p
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className={`text-2xl my-2 text-center break-words ${
                i === msgs.length - 1 ? "text-white" : "text-gray-400"
              }`}
            >
              {m.text}
            </motion.p>
          ))}
        </AnimatePresence>
        {/* Invisible bottom anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Pill footer */}
      <div
        className="
          fixed bottom-4 left-1/2 -translate-x-1/2
          bg-gray-800/90 dark:bg-gray-700/90 backdrop-blur-sm
          text-white rounded-full shadow-lg flex items-center gap-1
          px-6 py-2
        "
      >
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLang((s) => !s)}
            className="p-1 rounded hover:bg-white/10 text-xl"
          >
            {LANGS.find((l) => l.code === lang)?.emoji ?? "🌐"}
          </button>
          {showLang && (
            <ul className="absolute bottom-12 right-0 bg-gray-800 dark:bg-gray-700 border border-gray-600 rounded-xl overflow-hidden shadow-lg z-50">
              {LANGS.map((l) => (
                <li key={l.code}>
                  <button
                    onClick={() => pickLang(l.code)}
                    className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-700 ${
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
      </div>
    </div>
  );
}
