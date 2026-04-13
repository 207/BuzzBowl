import { create } from "zustand";

export type GameMode = "ffa" | "teams";

export interface Player {
  id: string;
  name: string;
  team?: number;
  score: number;
  avatar: string;
}

export interface GameState {
  code: string | null;
  hostName: string;
  mode: GameMode;
  players: Player[];
  status: "lobby" | "playing" | "results";
  currentQuestion: number;
  totalQuestions: number;
  questionData: QuestionData | null;
  answers: Record<string, string>;
  difficulty: string;
  category: string;
}

export interface QuestionData {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

const AVATARS = ["🦊", "🐸", "🐙", "🦄", "🐲", "🎃", "👾", "🤖", "🐱", "🦋", "🌸", "⚡"];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface GameStore extends GameState {
  createGame: (hostName: string, mode: GameMode, difficulty: string, category: string) => void;
  joinGame: (playerName: string) => void;
  setQuestion: (q: QuestionData) => void;
  submitAnswer: (playerId: string, answer: string) => void;
  nextQuestion: () => void;
  awardPoints: (playerId: string, points: number) => void;
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  code: null,
  hostName: "",
  mode: "ffa",
  players: [],
  status: "lobby",
  currentQuestion: 0,
  totalQuestions: 10,
  questionData: null,
  answers: {},
  difficulty: "easy",
  category: "",

  createGame: (hostName, mode, difficulty, category) => {
    const code = generateCode();
    const hostPlayer: Player = {
      id: "host",
      name: hostName,
      score: 0,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      team: mode === "teams" ? 1 : undefined,
    };
    set({
      code,
      hostName,
      mode,
      difficulty,
      category,
      players: [hostPlayer],
      status: "lobby",
      currentQuestion: 0,
      answers: {},
      questionData: null,
    });
  },

  joinGame: (playerName) => {
    const state = get();
    const avatar = AVATARS[state.players.length % AVATARS.length];
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: playerName,
      score: 0,
      avatar,
      team: state.mode === "teams" ? (state.players.length % 2) + 1 : undefined,
    };
    set({ players: [...state.players, newPlayer] });
  },

  setQuestion: (q) => set({ questionData: q, answers: {} }),

  submitAnswer: (playerId, answer) => {
    const state = get();
    set({ answers: { ...state.answers, [playerId]: answer } });
  },

  nextQuestion: () => {
    const state = get();
    set({ currentQuestion: state.currentQuestion + 1, answers: {}, questionData: null });
  },

  awardPoints: (playerId, points) => {
    const state = get();
    set({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      ),
    });
  },

  startGame: () => set({ status: "playing", currentQuestion: 1 }),
  endGame: () => set({ status: "results" }),
  resetGame: () =>
    set({
      code: null,
      hostName: "",
      mode: "ffa",
      players: [],
      status: "lobby",
      currentQuestion: 0,
      questionData: null,
      answers: {},
    }),
}));
