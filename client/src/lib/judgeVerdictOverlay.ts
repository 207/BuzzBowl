import type { ServerGameState } from "@/types/serverGame";
import { avatarIdForPlayerId } from "@/lib/avatarModels";

/** Resolve judge verdict overlay from flash payload (works during `between` after correct). */
export function judgeVerdictOverlayProps(state: ServerGameState | null) {
  if (!state?.judgeVerdictFlash) return null;
  const judgeId = state.judgeVerdictFlash.judgePlayerId;
  const judge = state.players.find((p) => p.id === judgeId);
  if (!judge) return null;
  return {
    flash: state.judgeVerdictFlash,
    judgeAvatarId: avatarIdForPlayerId(state.players, judgeId),
    judgeName: judge.nickname,
  };
}
