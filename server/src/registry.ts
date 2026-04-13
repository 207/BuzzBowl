import { Room } from "./room.js";

const rooms = new Map<string, Room>();

export function createRoom(): Room {
  for (let i = 0; i < 200; i++) {
    const r = Room.create();
    if (!rooms.has(r.code)) {
      rooms.set(r.code, r);
      return r;
    }
  }
  throw new Error("Could not allocate room code");
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.trim().toUpperCase());
}

export function attachRoomNotifier(room: Room, emit: (code: string, payload: unknown) => void): void {
  room.notify = (r) => emit(r.code, r.getStatePayload());
}
