/* client/src/hooks/useDarkMode.js */
import { useLayoutEffect, useState } from "react";

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "light" ? false : true; // default dark
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return [dark, setDark];
}
