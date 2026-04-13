import type { Server, Socket } from "socket.io";
import { fetchRandomTossups } from "./qbreader.js";
import {
  attachRoomNotifier,
  createRoom,
  getRoom,
} from "./registry.js";
import type { GameMode, GameSettings } from "./types.js";

function emitRoom(io: Server, code: string, payload: unknown): void {
  io.to(code).emit("game_state", payload);
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("create_room", () => {
      const room = createRoom();
      attachRoomNotifier(room, (code, payload) => emitRoom(io, code, payload));
      socket.join(room.code);
      socket.emit("host_created", {
        roomCode: room.code,
        hostSecret: room.hostSecret,
      });
      emitRoom(io, room.code, room.getStatePayload());
    });

    socket.on(
      "host_join",
      (
        msg: { roomCode: string; hostSecret: string },
        ack?: (res: { error?: string; ok?: boolean }) => void,
      ) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) {
          ack?.({ error: "invalid_host" });
          return;
        }
        if (!room.notify)
          attachRoomNotifier(room, (code, payload) => emitRoom(io, code, payload));
        socket.join(room.code);
        ack?.({ ok: true });
        emitRoom(io, room.code, room.getStatePayload());
      },
    );

    socket.on(
      "player_join",
      (
        msg: { roomCode: string; nickname: string },
        ack?: (res: { error?: string; playerId?: string }) => void,
      ) => {
        const room = getRoom(msg.roomCode);
        if (!room) {
          ack?.({ error: "room_not_found" });
          return;
        }
        if (room.phase !== "lobby") {
          ack?.({ error: "game_already_started" });
          return;
        }
        if (!room.notify)
          attachRoomNotifier(room, (code, payload) => emitRoom(io, code, payload));
        const p = room.addPlayer(msg.nickname, socket.id);
        socket.join(room.code);
        const meta = socket.data as { playerId?: string; roomCode?: string };
        meta.playerId = p.id;
        meta.roomCode = room.code;
        ack?.({ playerId: p.id });
        emitRoom(io, room.code, room.getStatePayload());
      },
    );

    socket.on(
      "player_identify",
      (
        msg: { roomCode: string; playerId: string },
        ack?: (res: { error?: string; ok?: boolean }) => void,
      ) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.players.has(msg.playerId)) {
          ack?.({ error: "invalid" });
          return;
        }
        room.bindSocket(msg.playerId, socket.id);
        socket.join(room.code);
        const meta = socket.data as { playerId?: string; roomCode?: string };
        meta.playerId = msg.playerId;
        meta.roomCode = room.code;
        ack?.({ ok: true });
        emitRoom(io, room.code, room.getStatePayload());
      },
    );

    socket.on(
      "set_game_mode",
      (msg: { roomCode: string; hostSecret: string; mode: GameMode }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.setGameMode(msg.mode);
      },
    );

    socket.on(
      "set_player_team",
      (msg: {
        roomCode: string;
        hostSecret: string;
        playerId: string;
        team: "A" | "B" | null;
      }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.setPlayerTeam(msg.playerId, msg.team);
      },
    );

    socket.on(
      "update_settings",
      (msg: {
        roomCode: string;
        hostSecret: string;
        settings: Partial<GameSettings>;
      }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.updateSettings(msg.settings);
      },
    );

    socket.on(
      "start_game",
      async (
        msg: {
          roomCode: string;
          hostSecret: string;
          settings?: Partial<GameSettings>;
        },
        ack?: (res: {
          error?: string;
          message?: string;
        }) => void,
      ) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) {
          ack?.({ error: "forbidden" });
          return;
        }
        if (msg.settings) room.updateSettings(msg.settings);
        const n = Math.max(room.settings.questionCount, 8);
        try {
          const tossups = await fetchRandomTossups({
            number: n,
            difficulties: room.settings.difficulties,
            category: room.settings.category,
          });
          if (tossups.length === 0) {
            ack?.({ error: "no_tossups" });
            return;
          }
          room.startGame(tossups);
          ack?.({});
        } catch (e) {
          ack?.({
            error: "fetch_failed",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      },
    );

    socket.on(
      "pause_reveal",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.pauseReveal();
      },
    );

    socket.on(
      "resume_reveal",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.resumeReveal();
      },
    );

    socket.on(
      "show_full_question",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.showFullQuestion();
      },
    );

    socket.on("buzz", (msg: { roomCode: string; playerId: string }) => {
      const room = getRoom(msg.roomCode);
      if (!room) return;
      const res = room.buzz(msg.playerId);
      if (res.ok) emitRoom(io, room.code, room.getStatePayload());
    });

    socket.on(
      "mark_correct",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.markCorrect();
      },
    );

    socket.on(
      "mark_incorrect",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.markIncorrect();
      },
    );

    socket.on(
      "skip_question",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.skipQuestion();
      },
    );

    socket.on(
      "continue_game",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !room.verifyHost(msg.hostSecret)) return;
        room.continueAfterBetween();
      },
    );

    socket.on("disconnect", () => {
      const code = (socket.data as { roomCode?: string }).roomCode;
      const room = code ? getRoom(code) : undefined;
      room?.removeSocket(socket.id);
      if (room) emitRoom(io, room.code, room.getStatePayload());
    });
  });
}
