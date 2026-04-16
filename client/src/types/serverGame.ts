export type ServerGameMode = "ffa" | "team";

export type ServerPhase = "lobby" | "playing" | "between" | "ended";

export interface ServerPlayer {
  id: string;
  nickname: string;
  team: "A" | "B" | null;
  score: number;
  buzzCount: number;
  correctCount: number;
  wrongCount: number;
  avatarDataUrl?: string;
}

export interface ServerGameSettings {
  questionCount: number;
  playMode: "house" | "remote";
  difficulties: number[];
  category: string;
  correctPoints: number;
  correctMidRevealPoints: number;
  negPoints: number;
  answerCountdownSeconds: number;
}

export interface ServerTossup {
  tossupId: string;
  revealedText: string;
  revealComplete: boolean;
  revealPaused: boolean;
  buzzPhase: "open" | "locked";
  buzzWinnerId: string | null;
  buzzWinnerName: string | null;
  answerDeadlineMs: number | null;
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
  /** Printed answer: on break, everyone sees previous tossup; during play, only the reader socket gets this. */
  answer: string | null;
  /** Designated reader for this tossup; cannot buzz; sees `answer` on their phone during play. */
  readerPlayerId: string | null;
  /** On break: this player may emit `continue_game` (same person who read the tossup). */
  betweenControlsPlayerId: string | null;
  activePlayerIdA: string | null;
  activePlayerIdB: string | null;
  eligibleBuzzIds: string[];
  /** FFA during play: player ids who voted to skip this tossup */
  ffaSkipVotes: string[];
  /** FFA during play: votes needed for unanimous skip (= player count) */
  ffaSkipVotesNeeded: number;
}
