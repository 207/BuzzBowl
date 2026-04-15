export type GameMode = "ffa" | "team";

export type BuzzPhase = "open" | "locked";

export interface Player {
  id: string;
  nickname: string;
  socketId: string | null;
  team: "A" | "B" | null;
  /** FFA: used. Team mode: display only; team scores on room */
  score: number;
  buzzCount: number;
  correctCount: number;
  wrongCount: number;
}

export interface TossupDTO {
  _id: string;
  question_sanitized: string;
  answer_sanitized: string;
}

export interface GameSettings {
  questionCount: number;
  /** QB Reader difficulty integers 0–10; empty = any */
  difficulties: number[];
  /** Comma-separated or single category; empty = any */
  category: string;
  correctPoints: number;
  negPoints: number;
}

export interface PublicTossupState {
  tossupId: string;
  revealedText: string;
  revealComplete: boolean;
  revealPaused: boolean;
  buzzPhase: BuzzPhase;
  buzzWinnerId: string | null;
  buzzWinnerName: string | null;
}
