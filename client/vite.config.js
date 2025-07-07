import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: isDev
    ? {
        https: {
          key: fs.readFileSync(
            path.join(process.env.HOME || "", "code/certs/localhost-key.pem")
          ),
          cert: fs.readFileSync(
            path.join(process.env.HOME || "", "code/certs/localhost.pem")
          ),
        },
        port: 5173,
        host: "localhost",
      }
    : {
        port: 5173,
        host: "0.0.0.0", // Better for container networking
      },
});
