import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { ServerGameState } from "@/types/serverGame";

export function useServerGameState(roomCode: string | undefined): ServerGameState | null {
  const [state, setState] = useState<ServerGameState | null>(null);
  const code = roomCode?.trim().toUpperCase();

  useEffect(() => {
    if (!code) return;
    const s = getSocket();
    const onState = (g: ServerGameState) => {
      if (g.code === code) setState(g);
    };
    s.on("game_state", onState);
    return () => {
      s.off("game_state", onState);
    };
  }, [code]);

  return state;
}
