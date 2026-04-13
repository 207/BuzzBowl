export type ServerGameMode = "ffa" | "team";

export type ServerPhase = "lobby" | "playing" | "between" | "ended";

export interface ServerPlayer {
  id: string;
  nickname: string;
  team: "A" | "B" | null;
  score: number;
}

export interface ServerGameSettings {
  questionCount: number;
  difficulties: number[];
  category: string;
  correctPoints: number;
  negPoints: number;
}

export interface ServerTossup {
  tossupId: string;
  revealedText: string;
  revealComplete: boolean;
  revealPaused: boolean;
  buzzPhase: "open" | "locked";
  buzzWinnerId: string | null;
  buzzWinnerName: string | null;
}

export interface ServerGameState {
  code: string;
  phase: ServerPhase;
  gameMode: ServerGameMode;
  teamNames: { A: string; B: string };
  settings: ServerGameSettings;
  players: ServerPlayer[];
  teamScoreA: number;
  teamScoreB: number;
  currentTossupIndex: number;
  totalTossups: number;
  tossup: ServerTossup | null;
  answer: string | null;
  activePlayerIdA: string | null;
  activePlayerIdB: string | null;
  eligibleBuzzIds: string[];
}
