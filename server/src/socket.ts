import type { Server, Socket } from "socket.io";
import { fetchRandomTossups } from "./qbreader.js";
import {
  attachRoomNotifier,
  createRoom,
  getRoom,
} from "./registry.js";
import type { Room } from "./room.js";
import type { GameMode, GameSettings } from "./types.js";

/** Per-socket payload so the printed answer is only sent to the designated reader. */
async function emitGameStateToRoom(io: Server, room: Room): Promise<void> {
  const sockets = await io.in(room.code).fetchSockets();
  for (const sock of sockets) {
    const meta = sock.data as { playerId?: string };
    const includeReaderAnswer = Boolean(
      meta.playerId && meta.playerId === room.getReaderPlayerId(),
    );
    sock.emit("game_state", room.getStatePayload({ includeReaderAnswer }));
  }
}

function scheduleEmitGameState(io: Server, room: Room): void {
  void emitGameStateToRoom(io, room).catch((e) => {
    console.error("emitGameStateToRoom", e);
  });
}

function ensureRoomNotifications(io: Server, room: Room): void {
  if (!room.notify) attachRoomNotifier(room, (r) => scheduleEmitGameState(io, r));
}

function verifiedHostRoom(
  msg: { roomCode: string; hostSecret: string },
): Room | undefined {
  const room = getRoom(msg.roomCode);
  if (!room || !room.verifyHost(msg.hostSecret)) return undefined;
  return room;
}

function runIfHostOrPlayingReader(
  msg: { roomCode: string; hostSecret?: string; playerId?: string },
  action: (room: Room) => void,
): void {
  const room = getRoom(msg.roomCode);
  if (!room || !isHostOrPlayingReader(room, msg)) return;
  action(room);
}

function runIfHostOrBetweenReader(
  msg: { roomCode: string; hostSecret?: string; playerId?: string },
  action: (room: Room) => void,
): void {
  const room = getRoom(msg.roomCode);
  if (!room || !isHostOrBetweenReader(room, msg)) return;
  action(room);
}

function isHost(room: Room, hostSecret?: string): boolean {
  return Boolean(hostSecret && room.verifyHost(hostSecret));
}

function isPlayingReader(room: Room, playerId?: string): boolean {
  if (!playerId || !room.players.has(playerId)) return false;
  return room.phase === "playing" && room.getReaderPlayerId() === playerId;
}

function isBetweenReader(room: Room, playerId?: string): boolean {
  if (!playerId || !room.players.has(playerId)) return false;
  return (
    room.phase === "between" && room.readerBetweenPlayerId === playerId
  );
}

function isHostOrPlayingReader(
  room: Room,
  msg: { hostSecret?: string; playerId?: string },
): boolean {
  return isHost(room, msg.hostSecret) || isPlayingReader(room, msg.playerId);
}

function isHostOrBetweenReader(
  room: Room,
  msg: { hostSecret?: string; playerId?: string },
): boolean {
  return isHost(room, msg.hostSecret) || isBetweenReader(room, msg.playerId);
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("create_room", () => {
      const room = createRoom();
      ensureRoomNotifications(io, room);
      socket.join(room.code);
      socket.emit("host_created", {
        roomCode: room.code,
        hostSecret: room.hostSecret,
      });
      scheduleEmitGameState(io, room);
    });

    socket.on(
      "host_join",
      (
        msg: { roomCode: string; hostSecret: string },
        ack?: (res: { error?: string; ok?: boolean }) => void,
      ) => {
        const room = verifiedHostRoom(msg);
        if (!room) {
          ack?.({ error: "invalid_host" });
          return;
        }
        ensureRoomNotifications(io, room);
        socket.join(room.code);
        ack?.({ ok: true });
        scheduleEmitGameState(io, room);
      },
    );

    socket.on(
      "player_join",
      (
        msg: { roomCode: string; nickname: string; avatarDataUrl?: string },
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
        ensureRoomNotifications(io, room);
        let avatar: string | null = null;
        const raw = msg.avatarDataUrl;
        if (typeof raw === "string" && raw.startsWith("data:image/")) {
          const trimmed = raw.slice(0, 140_000);
          if (trimmed.length === raw.length) avatar = trimmed;
        }
        const p = room.addPlayer(msg.nickname, socket.id, avatar);
        socket.join(room.code);
        const meta = socket.data as { playerId?: string; roomCode?: string };
        meta.playerId = p.id;
        meta.roomCode = room.code;
        ack?.({ playerId: p.id });
        scheduleEmitGameState(io, room);
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
        scheduleEmitGameState(io, room);
      },
    );

    socket.on(
      "set_game_mode",
      (msg: { roomCode: string; hostSecret: string; mode: GameMode }) => {
        const room = verifiedHostRoom(msg);
        if (!room) return;
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
        const room = verifiedHostRoom(msg);
        if (!room) return;
        room.setPlayerTeam(msg.playerId, msg.team);
      },
    );

    socket.on(
      "kick_player",
      (msg: { roomCode: string; hostSecret: string; playerId: string }) => {
        const room = verifiedHostRoom(msg);
        if (!room) return;
        room.removePlayer(msg.playerId);
      },
    );

    socket.on(
      "randomize_teams",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = verifiedHostRoom(msg);
        if (!room) return;
        room.randomizeTeams();
      },
    );

    socket.on(
      "update_settings",
      (msg: {
        roomCode: string;
        hostSecret: string;
        settings: Partial<GameSettings>;
      }) => {
        const room = verifiedHostRoom(msg);
        if (!room) return;
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
        const room = verifiedHostRoom(msg);
        if (!room) {
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
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.pauseReveal());
      },
    );

    socket.on(
      "resume_reveal",
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.resumeReveal());
      },
    );

    socket.on(
      "show_full_question",
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.showFullQuestion());
      },
    );

    socket.on("buzz", (msg: { roomCode: string; playerId: string }) => {
      const room = getRoom(msg.roomCode);
      if (!room) return;
      room.buzz(msg.playerId);
    });

    socket.on(
      "mark_correct",
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.markCorrect());
      },
    );

    socket.on(
      "mark_incorrect",
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.markIncorrect());
      },
    );

    socket.on(
      "skip_question",
      (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        runIfHostOrPlayingReader(msg, (room) => room.skipQuestion());
      },
    );

    socket.on(
      "continue_game",
      async (msg: { roomCode: string; hostSecret?: string; playerId?: string }) => {
        const room = getRoom(msg.roomCode);
        if (!room || !isHostOrBetweenReader(room, msg)) return;
        if (room.phase !== "between") return;
        let replacement: Awaited<ReturnType<typeof fetchRandomTossups>>[0] | null =
          null;
        if (room.isSkipNoProgressContinuePending()) {
          try {
            const arr = await fetchRandomTossups({
              number: 1,
              difficulties: room.settings.difficulties,
              category: room.settings.category,
            });
            replacement = arr[0] ?? null;
          } catch (e) {
            console.error("continue_game replacement tossup", e);
          }
        }
        room.continueAfterBetween(replacement);
      },
    );

    socket.on("vote_ffa_skip", (msg: { roomCode: string; playerId: string }) => {
      const room = getRoom(msg.roomCode);
      if (!room) return;
      room.voteFfaSkip(msg.playerId);
    });

    socket.on(
      "restart_game",
      (msg: { roomCode: string; hostSecret: string }) => {
        const room = verifiedHostRoom(msg);
        if (!room) return;
        room.restartToLobby();
      },
    );

    socket.on("disconnect", () => {
      const code = (socket.data as { roomCode?: string }).roomCode;
      const room = code ? getRoom(code) : undefined;
      room?.removeSocket(socket.id);
      if (room) scheduleEmitGameState(io, room);
    });
  });
}
