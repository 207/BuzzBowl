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

/** Reader-side controls (emitted with `roomCode` + `playerId` only). */
export type ReaderControlEvent =
  | "pause_reveal"
  | "resume_reveal"
  | "show_full_question"
  | "mark_correct"
  | "mark_incorrect"
  | "skip_question"
  | "continue_game";

export function emitReaderControl(
  event: ReaderControlEvent,
  payload: { roomCode: string; playerId: string },
): void {
  getSocket().emit(event, payload);
}
