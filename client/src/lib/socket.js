/* # file: client/src/lib/socket.js */
import { io } from "socket.io-client";

// Same origin but different port
export const socket = io("https://localhost:3000", {
  transports: ["websocket"],
  withCredentials: true,
});
