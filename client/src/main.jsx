/* # file: client/src/main.jsx */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import AdminEcho from "./pages/AdminEcho.jsx";
import LiveFeed from "./pages/LiveFeed.jsx";
import AdminMic from "./pages/AdminMic.jsx";
import "./index.css";
import AppToaster from "./components/AppToaster";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminMic />} />
        <Route path="/live" element={<LiveFeed />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
