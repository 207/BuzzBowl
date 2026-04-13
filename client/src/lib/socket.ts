import { io, type Socket } from "socket.io-client";

const url =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.PROD ? undefined : "http://localhost:3001");

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(url, { transports: ["websocket", "polling"] });
  }
  return _socket;
}
