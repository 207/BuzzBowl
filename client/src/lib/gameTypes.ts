/** UI types shared with list components (matches former gameStore shape). */

import type { ServerGameMode, ServerPlayer } from "@/types/serverGame";
import { avatarForPlayerIndex, isAvatarId, type AvatarId } from "@/lib/avatarModels";

export type GameMode = "ffa" | "teams";

export interface Player {
  id: string;
  name: string;
  team?: number;
  score: number;
  avatarId: AvatarId;
  /** Join selfie (data URL); when set, UI shows photo instead of 3D avatar */
  selfieDataUrl?: string | null;
  stats: {
    buzzed: number;
    correct: number;
    wrong: number;
  };
}

export function mapServerPlayers(
  players: ServerPlayer[],
  gameMode: ServerGameMode,
): Player[] {
  return players.map((p, i) => ({
    id: p.id,
    name: p.nickname,
    score: p.score,
    avatarId: isAvatarId(p.avatarId) ? p.avatarId : avatarForPlayerIndex(i),
    selfieDataUrl: p.avatarDataUrl ?? null,
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
