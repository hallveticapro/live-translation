/* # file: client/src/lib/socket.js */
import { io } from "socket.io-client";

// Same origin but different port
export const socket = io(import.meta.env.VITE_API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});
