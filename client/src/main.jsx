/* # file: client/src/main.jsx */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import AdminMicTest from "./pages/AdminMicTest.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminMicTest />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
