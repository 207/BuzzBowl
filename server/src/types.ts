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
  /** Optional join selfie (data URL), session-only */
  avatarDataUrl?: string | null;
}

export interface TossupDTO {
  _id: string;
  question_sanitized: string;
  answer_sanitized: string;
  category?: string | null;
}

export type QuestionSource = "qbreader" | "opentdb";

export interface GameSettings {
  questionCount: number;
  /** Presentation mode: house uses host display, remote is phones-only */
  playMode: "house" | "remote";
  /** Quizbowl (QB Reader) vs general multiple-choice trivia (OpenTDB; no T/F, choices hidden). */
  questionSource: QuestionSource;
  /** QB Reader difficulty integers 0–10; empty = any */
  difficulties: number[];
  /** Comma-separated or single category; empty = any */
  category: string;
  /** Points when marked correct after the tossup is fully revealed */
  correctPoints: number;
  /** Points when marked correct on an interrupt (before full reveal) */
  correctMidRevealPoints: number;
  negPoints: number;
  /** After buzz: seconds before auto-incorrect (0 = disabled) */
  answerCountdownSeconds: number;
}

export interface PublicTossupState {
  tossupId: string;
  category: string | null;
  revealedText: string;
  revealComplete: boolean;
  revealPaused: boolean;
  buzzPhase: BuzzPhase;
  buzzWinnerId: string | null;
  buzzWinnerName: string | null;
  /** Wall-clock ms when answer countdown ends (auto-incorrect); null if none */
  answerDeadlineMs: number | null;
}
