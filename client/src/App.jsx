import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import AppToaster from "./components/AppToaster";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold text-blue-600">
        Vite + React + Tailwind v4
      </h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <a href="/admin" className="text-blue-600 underline">
        Go to /admin mic test
      </a>
      /* inside the return (…) */
      <div className="flex flex-col gap-4 text-xl">
        <a href="/admin" className="text-blue-600 underline">
          Go to /admin
        </a>
        <a href="/live" className="text-blue-600 underline">
          Go to /live
        </a>
      </div>
      <RouterProvider router={router} />
      <AppToaster /> {/* add here */}
    </>
  );
}

export default App;
