import { customAlphabet } from "nanoid";
import type {
  BuzzPhase,
  GameMode,
  GameSettings,
  Player,
  PublicTossupState,
  TossupDTO,
} from "./types.js";

const roomCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const genRoomCode = customAlphabet(roomCodeAlphabet, 6);
const genSecret = customAlphabet(roomCodeAlphabet, 24);
const genPlayerId = customAlphabet(roomCodeAlphabet, 10);

const defaultSettings: GameSettings = {
  questionCount: 10,
  difficulties: [],
  category: "",
  correctPoints: 10,
  negPoints: 5,
};

function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export type RoomPhase = "lobby" | "playing" | "between" | "ended";

export class Room {
  readonly code: string;
  readonly hostSecret: string;
  players = new Map<string, Player>();
  gameMode: GameMode = "ffa";
  teamNames = { A: "Team A", B: "Team B" };
  /** Roster order per team (player ids) */
  teamOrderA: string[] = [];
  teamOrderB: string[] = [];
  activeIndexA = 0;
  activeIndexB = 0;
  settings: GameSettings = { ...defaultSettings };
  phase: RoomPhase = "lobby";
  tossupQueue: TossupDTO[] = [];
  currentTossupIndex = -1;
  private revealTimer: ReturnType<typeof setInterval> | null = null;
  readonly revealMsPerWord = 400;

  private current: {
    dto: TossupDTO;
    words: string[];
    revealIndex: number;
    revealComplete: boolean;
    revealPaused: boolean;
    buzzPhase: BuzzPhase;
    buzzWinnerId: string | null;
    /** If set, only these player ids may buzz (team mode neg) */
    buzzEligibleIds: string[] | null;
  } | null = null;

  teamScoreA = 0;
  teamScoreB = 0;

  /** Player ids in join order, fixed at `startGame` (FFA reader rotation). */
  ffaTurnOrder: string[] = [];
  /** Set when a tossup round ends; shown to everyone on the break screen; cleared on continue. */
  lastRoundAnswer: string | null = null;

  /** Set by socket layer to push state after each change */
  notify: (() => void) | null = null;

  private push(): void {
    this.notify?.();
  }

  static create(): Room {
    return new Room(genRoomCode(), genSecret());
  }

  private constructor(code: string, hostSecret: string) {
    this.code = code;
    this.hostSecret = hostSecret;
  }

  verifyHost(secret: string): boolean {
    return secret === this.hostSecret;
  }

  addPlayer(nickname: string, socketId: string): Player {
    const id = genPlayerId();
    const p: Player = {
      id,
      nickname: nickname.trim().slice(0, 24) || "Player",
      socketId,
      team: null,
      score: 0,
    };
    this.players.set(id, p);
    this.push();
    return p;
  }

  removeSocket(socketId: string): void {
    for (const p of this.players.values()) {
      if (p.socketId === socketId) p.socketId = null;
    }
  }

  bindSocket(playerId: string, socketId: string): boolean {
    const p = this.players.get(playerId);
    if (!p) return false;
    p.socketId = socketId;
    this.push();
    return true;
  }

  setPlayerTeam(playerId: string, team: "A" | "B" | null): void {
    const p = this.players.get(playerId);
    if (!p) return;
    p.team = team;
    this.rebuildTeamOrders();
    this.push();
  }

  private rebuildTeamOrders(): void {
    this.teamOrderA = [...this.players.values()]
      .filter((p) => p.team === "A")
      .map((p) => p.id);
    this.teamOrderB = [...this.players.values()]
      .filter((p) => p.team === "B")
      .map((p) => p.id);
  }

  setGameMode(mode: GameMode): void {
    this.gameMode = mode;
    if (mode === "ffa") {
      for (const p of this.players.values()) p.team = null;
      this.teamOrderA = [];
      this.teamOrderB = [];
    }
    this.push();
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = {
      ...this.settings,
      ...partial,
      difficulties: partial.difficulties ?? this.settings.difficulties,
    };
    this.push();
  }

  startGame(tossups: TossupDTO[]): void {
    if (tossups.length === 0) throw new Error("No tossups");
    if (this.gameMode === "team") {
      this.rebuildTeamOrders();
      if (this.teamOrderA.length === 0 || this.teamOrderB.length === 0) {
        throw new Error("Team mode needs at least one player on each team");
      }
    }
    this.tossupQueue = tossups.slice(0, this.settings.questionCount);
    this.currentTossupIndex = -1;
    this.phase = "playing";
    this.teamScoreA = 0;
    this.teamScoreB = 0;
    this.activeIndexA = 0;
    this.activeIndexB = 0;
    for (const p of this.players.values()) p.score = 0;
    this.ffaTurnOrder = [...this.players.keys()];
    this.advanceToNextTossup();
    this.push();
  }

  private clearRevealTimer(): void {
    if (this.revealTimer) {
      clearInterval(this.revealTimer);
      this.revealTimer = null;
    }
  }

  private startRevealTicker(): void {
    this.clearRevealTimer();
    this.revealTimer = setInterval(() => {
      this.tickReveal();
    }, this.revealMsPerWord);
  }

  private tickReveal(): void {
    if (!this.current || this.current.revealPaused || this.current.revealComplete)
      return;
    if (this.current.revealIndex < this.current.words.length) {
      this.current.revealIndex += 1;
      if (this.current.revealIndex >= this.current.words.length) {
        this.current.revealComplete = true;
        this.clearRevealTimer();
      }
    }
    this.push();
  }

  advanceToNextTossup(): void {
    this.clearRevealTimer();
    this.current = null;
    this.currentTossupIndex += 1;
    if (this.currentTossupIndex >= this.tossupQueue.length) {
      this.phase = "ended";
      this.push();
      return;
    }
    const dto = this.tossupQueue[this.currentTossupIndex]!;
    const words = splitWords(dto.question_sanitized);
    this.current = {
      dto,
      words,
      revealIndex: 0,
      revealComplete: words.length === 0,
      revealPaused: false,
      buzzPhase: "open",
      buzzWinnerId: null,
      buzzEligibleIds: null,
    };
    if (!this.current.revealComplete) this.startRevealTicker();
    this.push();
  }

  pauseReveal(): void {
    if (this.current) this.current.revealPaused = true;
    this.push();
  }

  resumeReveal(): void {
    if (!this.current || this.current.revealComplete) return;
    this.current.revealPaused = false;
    this.push();
  }

  showFullQuestion(): void {
    if (!this.current) return;
    this.current.revealIndex = this.current.words.length;
    this.current.revealComplete = true;
    this.clearRevealTimer();
    this.push();
  }

  getReaderPlayerId(): string | null {
    if (!this.current || this.phase !== "playing") return null;
    if (this.gameMode === "ffa") {
      if (this.ffaTurnOrder.length === 0) return null;
      return this.ffaTurnOrder[this.currentTossupIndex % this.ffaTurnOrder.length] ?? null;
    }
    const sideA = this.currentTossupIndex % 2 === 0;
    const order = sideA ? this.teamOrderA : this.teamOrderB;
    if (order.length === 0) return null;
    const idx = Math.floor(this.currentTossupIndex / 2) % order.length;
    return order[idx] ?? null;
  }

  eligibleBuzzPlayerIds(): string[] {
    if (!this.current || this.current.buzzPhase !== "open") return [];
    const reader = this.getReaderPlayerId();
    const withoutReader = (ids: string[]) =>
      reader ? ids.filter((id) => id !== reader) : ids;
    if (this.current.buzzEligibleIds)
      return withoutReader([...this.current.buzzEligibleIds]);
    if (this.gameMode === "ffa") {
      return withoutReader([...this.players.keys()]);
    }
    const a = this.teamOrderA[this.activeIndexA];
    const b = this.teamOrderB[this.activeIndexB];
    return withoutReader([a, b].filter(Boolean) as string[]);
  }

  buzz(playerId: string): { ok: boolean; reason?: string } {
    if (!this.current || this.phase !== "playing")
      return { ok: false, reason: "no_active_question" };
    if (this.current.buzzPhase !== "open")
      return { ok: false, reason: "buzz_closed" };
    const eligible = this.eligibleBuzzPlayerIds();
    if (!eligible.includes(playerId)) return { ok: false, reason: "not_eligible" };
    this.current.buzzPhase = "locked";
    this.current.buzzWinnerId = playerId;
    this.clearRevealTimer();
    this.push();
    return { ok: true };
  }

  getBuzzWinner(): Player | null {
    if (!this.current?.buzzWinnerId) return null;
    return this.players.get(this.current.buzzWinnerId) ?? null;
  }

  markCorrect(): void {
    const winner = this.getBuzzWinner();
    if (!winner || !this.current) return;
    const pts = this.settings.correctPoints;
    if (this.gameMode === "ffa") {
      winner.score += pts;
    } else {
      if (winner.team === "A") this.teamScoreA += pts;
      if (winner.team === "B") this.teamScoreB += pts;
    }
    this.finishTossupRound();
  }

  markIncorrect(): void {
    const winner = this.getBuzzWinner();
    if (!winner || !this.current) return;
    const neg = this.settings.negPoints;
    const midReveal = !this.current.revealComplete;

    if (this.gameMode === "ffa") {
      if (midReveal) winner.score -= neg;
      this.current.buzzPhase = "open";
      this.current.buzzWinnerId = null;
      this.current.buzzEligibleIds = null;
      if (!this.current.revealComplete && !this.revealTimer)
        this.startRevealTicker();
      this.push();
      return;
    }

    // Team mode
    if (midReveal) {
      if (winner.team === "A") this.teamScoreA -= neg;
      if (winner.team === "B") this.teamScoreB -= neg;
      const other = this.otherActiveRep(winner.id);
      this.current.buzzPhase = "open";
      this.current.buzzWinnerId = null;
      this.current.buzzEligibleIds = other ? [other] : [];
    } else {
      // No neg points after reveal complete (v1)
      this.current.buzzPhase = "open";
      this.current.buzzWinnerId = null;
      this.current.buzzEligibleIds = null;
    }
    if (!this.current.revealComplete && !this.revealTimer)
      this.startRevealTicker();
    this.push();
  }

  private otherActiveRep(buzzedId: string): string | null {
    const a = this.teamOrderA[this.activeIndexA];
    const b = this.teamOrderB[this.activeIndexB];
    if (buzzedId === a) return b ?? null;
    if (buzzedId === b) return a ?? null;
    return null;
  }

  skipQuestion(): void {
    this.finishTossupRound();
  }

  /** Host ends tossup without full resolve (e.g. after incorrect and wants next) */
  nextQuestionHost(): void {
    this.finishTossupRound();
  }

  private finishTossupRound(): void {
    this.lastRoundAnswer = this.getAnswerLine();
    this.clearRevealTimer();
    if (this.gameMode === "team") {
      if (this.teamOrderA.length)
        this.activeIndexA =
          (this.activeIndexA + 1) % this.teamOrderA.length;
      if (this.teamOrderB.length)
        this.activeIndexB =
          (this.activeIndexB + 1) % this.teamOrderB.length;
    }
    this.phase = "between";
    this.current = null;
    this.push();
  }

  continueAfterBetween(): void {
    if (this.phase !== "between") return;
    this.lastRoundAnswer = null;
    this.phase = "playing";
    this.advanceToNextTossup();
  }

  getPublicTossupState(): PublicTossupState | null {
    if (!this.current) return null;
    const c = this.current;
    const revealedText = c.words.slice(0, c.revealIndex).join(" ");
    const w = c.buzzWinnerId
      ? this.players.get(c.buzzWinnerId)?.nickname ?? null
      : null;
    return {
      tossupId: c.dto._id,
      revealedText,
      revealComplete: c.revealComplete,
      revealPaused: c.revealPaused,
      buzzPhase: c.buzzPhase,
      buzzWinnerId: c.buzzWinnerId,
      buzzWinnerName: w,
    };
  }

  getAnswerLine(): string | null {
    return this.current?.dto.answer_sanitized ?? null;
  }

  getStatePayload(opts?: { includeReaderAnswer?: boolean }) {
    const players = [...this.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      team: p.team,
      score: p.score,
    }));
    const activeA = this.teamOrderA[this.activeIndexA] ?? null;
    const activeB = this.teamOrderB[this.activeIndexB] ?? null;
    const readerId = this.getReaderPlayerId();

    let answer: string | null = null;
    if (this.phase === "between" && this.lastRoundAnswer) {
      answer = this.lastRoundAnswer;
    } else if (
      this.phase === "playing" &&
      this.current &&
      opts?.includeReaderAnswer
    ) {
      answer = this.getAnswerLine();
    }

    return {
      code: this.code,
      phase: this.phase,
      gameMode: this.gameMode,
      teamNames: this.teamNames,
      settings: this.settings,
      players,
      teamScoreA: this.teamScoreA,
      teamScoreB: this.teamScoreB,
      currentTossupIndex: this.currentTossupIndex,
      totalTossups: this.tossupQueue.length,
      tossup: this.getPublicTossupState(),
      answer,
      readerPlayerId: readerId,
      activePlayerIdA: activeA,
      activePlayerIdB: activeB,
      eligibleBuzzIds: this.eligibleBuzzPlayerIds(),
    };
  }
}

export type RoomNotify = () => void;
