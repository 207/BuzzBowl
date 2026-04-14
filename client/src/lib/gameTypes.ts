/** UI types shared with list components (matches former gameStore shape). */

import type { ServerGameMode, ServerPlayer } from "@/types/serverGame";

export type GameMode = "ffa" | "teams";

export interface Player {
  id: string;
  name: string;
  team?: number;
  score: number;
  avatar: string;
  stats: {
    buzzed: number;
    correct: number;
    wrong: number;
  };
}

export const AVATARS = [
  "🦊",
  "🐸",
  "🐙",
  "🦄",
  "🐲",
  "🎃",
  "👾",
  "🤖",
  "🐱",
  "🦋",
  "🌸",
  "⚡",
];

export function mapServerPlayers(
  players: ServerPlayer[],
  gameMode: ServerGameMode,
): Player[] {
  return players.map((p, i) => ({
    id: p.id,
    name: p.nickname,
    score: p.score,
    avatar: AVATARS[i % AVATARS.length],
    stats: {
      buzzed: p.buzzCount,
      correct: p.correctCount,
      wrong: p.wrongCount,
    },
    team:
      gameMode === "team"
        ? p.team === "A"
          ? 1
          : p.team === "B"
            ? 2
            : undefined
        : undefined,
  }));
}
