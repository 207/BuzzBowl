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
  playMode: "house",
  difficulties: [],
  category: "",
  correctPoints: 10,
  correctMidRevealPoints: 10,
  negPoints: 5,
  answerCountdownSeconds: 10,
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
  private answerTimer: ReturnType<typeof setTimeout> | null = null;
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
    answerDeadlineMs: number | null;
    /** FFA: unanimous vote-skip tracking */
    ffaSkipVotes: Set<string> | null;
  } | null = null;

  /**
   * When true, the next `continueAfterBetween` replaces the current queue slot with a new tossup
   * instead of advancing the index (skipped tossups do not count toward the game length).
   */
  private skipNoProgressTossupPending = false;

  teamScoreA = 0;
  teamScoreB = 0;

  /** Player ids in join order, fixed at `startGame` (FFA reader rotation). */
  ffaTurnOrder: string[] = [];
  /** Set when a tossup round ends; shown to everyone on the break screen; cleared on continue. */
  lastRoundAnswer: string | null = null;
  /** Reader who may tap “next tossup” on break; set with `lastRoundAnswer` before `current` is cleared. */
  readerBetweenPlayerId: string | null = null;

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

  addPlayer(
    nickname: string,
    socketId: string,
    avatarDataUrl?: string | null,
  ): Player {
    const id = genPlayerId();
    const p: Player = {
      id,
      nickname: nickname.trim().slice(0, 24) || "Player",
      socketId,
      team: null,
      score: 0,
      buzzCount: 0,
      correctCount: 0,
      wrongCount: 0,
      avatarDataUrl: avatarDataUrl ?? null,
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

  removePlayer(playerId: string): boolean {
    if (this.phase !== "lobby") return false;
    const removed = this.players.delete(playerId);
    if (!removed) return false;
    this.rebuildTeamOrders();
    this.push();
    return true;
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

  randomizeTeams(): void {
    if (this.phase !== "lobby") return;
    const shuffled = [...this.players.values()];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j]!;
      shuffled[j] = tmp!;
    }
    shuffled.forEach((p, i) => {
      p.team = i % 2 === 0 ? "A" : "B";
    });
    this.rebuildTeamOrders();
    this.push();
  }

  updateSettings(partial: Partial<GameSettings>): void {
    const merged: GameSettings = {
      ...this.settings,
      ...partial,
      difficulties: partial.difficulties ?? this.settings.difficulties,
    };
    if (
      partial.correctMidRevealPoints === undefined &&
      partial.correctPoints !== undefined
    ) {
      merged.correctMidRevealPoints = merged.correctPoints;
    }
    const clampInt = (n: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, Math.round(Number(n)) || 0));
    merged.correctPoints = clampInt(merged.correctPoints, 0, 500);
    merged.correctMidRevealPoints = clampInt(merged.correctMidRevealPoints, 0, 500);
    merged.negPoints = clampInt(merged.negPoints, 0, 500);
    merged.answerCountdownSeconds = clampInt(merged.answerCountdownSeconds, 0, 120);
    merged.questionCount = clampInt(merged.questionCount, 1, 50);
    merged.playMode = merged.playMode === "remote" ? "remote" : "house";
    this.settings = merged;
    this.push();
  }

  startGame(tossups: TossupDTO[]): void {
    if (tossups.length === 0) throw new Error("No tossups");
    this.skipNoProgressTossupPending = false;
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
    this.readerBetweenPlayerId = null;
    this.advanceToNextTossup();
    this.push();
  }

  restartToLobby(): void {
    this.clearRevealTimer();
    this.clearAnswerTimer();
    this.skipNoProgressTossupPending = false;
    this.current = null;
    this.phase = "lobby";
    this.tossupQueue = [];
    this.currentTossupIndex = -1;
    this.teamScoreA = 0;
    this.teamScoreB = 0;
    this.activeIndexA = 0;
    this.activeIndexB = 0;
    this.lastRoundAnswer = null;
    this.readerBetweenPlayerId = null;
    this.ffaTurnOrder = [...this.players.keys()];
    for (const p of this.players.values()) {
      p.score = 0;
      p.buzzCount = 0;
      p.correctCount = 0;
      p.wrongCount = 0;
    }
    this.push();
  }

  private clearRevealTimer(): void {
    if (this.revealTimer) {
      clearInterval(this.revealTimer);
      this.revealTimer = null;
    }
  }

  private clearAnswerTimer(): void {
    if (this.answerTimer) {
      clearTimeout(this.answerTimer);
      this.answerTimer = null;
    }
    if (this.current) this.current.answerDeadlineMs = null;
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

  private loadTossupAtIndex(idx: number): void {
    this.clearRevealTimer();
    this.clearAnswerTimer();
    this.current = null;
    if (idx < 0 || idx >= this.tossupQueue.length) {
      this.phase = "ended";
      this.push();
      return;
    }
    const dto = this.tossupQueue[idx]!;
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
      answerDeadlineMs: null,
      ffaSkipVotes: this.gameMode === "ffa" ? new Set() : null,
    };
    if (!this.current.revealComplete) this.startRevealTicker();
    this.push();
  }

  /** Advance index and load next tossup (counts toward game length). */
  advanceToNextTossup(): void {
    this.currentTossupIndex += 1;
    this.loadTossupAtIndex(this.currentTossupIndex);
  }

  /** Reload tossup at the current index (used after a no-progress skip). */
  private loadTossupAtCurrentIndex(): void {
    this.loadTossupAtIndex(this.currentTossupIndex);
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
    const activeA = this.teamOrderA[this.activeIndexA] ?? null;
    const activeB = this.teamOrderB[this.activeIndexB] ?? null;
    const sideA = this.currentTossupIndex % 2 === 0;
    const primaryOrder = sideA ? this.teamOrderA : this.teamOrderB;
    const secondaryOrder = sideA ? this.teamOrderB : this.teamOrderA;
    const roundIndex = Math.floor(this.currentTossupIndex / 2);
    const pickBench = (order: string[]): string | null => {
      if (order.length === 0) return null;
      const start = roundIndex % order.length;
      for (let k = 0; k < order.length; k += 1) {
        const cand = order[(start + k) % order.length]!;
        if (cand !== activeA && cand !== activeB) return cand;
      }
      return null;
    };
    return pickBench(primaryOrder) ?? pickBench(secondaryOrder);
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
    this.clearAnswerTimer();
    if (this.current.ffaSkipVotes) this.current.ffaSkipVotes.clear();
    this.current.buzzPhase = "locked";
    this.current.buzzWinnerId = playerId;
    const player = this.players.get(playerId);
    if (player) player.buzzCount += 1;
    this.clearRevealTimer();
    const sec = this.settings.answerCountdownSeconds;
    if (sec > 0) {
      const deadline = Date.now() + sec * 1000;
      this.current.answerDeadlineMs = deadline;
      this.answerTimer = setTimeout(() => {
        this.answerTimer = null;
        if (this.current?.buzzPhase === "locked") this.markIncorrect();
      }, sec * 1000);
    } else {
      this.current.answerDeadlineMs = null;
    }
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
    this.skipNoProgressTossupPending = false;
    this.clearAnswerTimer();
    const pts = this.current.revealComplete
      ? this.settings.correctPoints
      : this.settings.correctMidRevealPoints;
    winner.correctCount += 1;
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
    this.clearAnswerTimer();
    const neg = this.settings.negPoints;
    const midReveal = !this.current.revealComplete;
    winner.wrongCount += 1;

    if (this.gameMode === "ffa") {
      if (midReveal) winner.score -= neg;
      if (this.current.ffaSkipVotes) this.current.ffaSkipVotes.clear();
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
    this.skipNoProgressTossupPending = true;
    this.finishTossupRound();
  }

  /** Host ends tossup without full resolve (e.g. after incorrect and wants next) */
  nextQuestionHost(): void {
    this.skipNoProgressTossupPending = true;
    this.finishTossupRound();
  }

  /** FFA only: player vote to skip; skips when every player has voted. */
  voteFfaSkip(playerId: string): { ok: boolean; reason?: string } {
    if (this.gameMode !== "ffa" || this.phase !== "playing" || !this.current)
      return { ok: false, reason: "not_applicable" };
    if (!this.players.has(playerId)) return { ok: false, reason: "not_player" };
    const votes = this.current.ffaSkipVotes;
    if (!votes) return { ok: false, reason: "not_applicable" };
    votes.add(playerId);
    if (votes.size >= this.players.size) {
      this.skipNoProgressTossupPending = true;
      this.finishTossupRound();
      return { ok: true };
    }
    this.push();
    return { ok: true };
  }

  private finishTossupRound(): void {
    this.lastRoundAnswer = this.getAnswerLine();
    this.readerBetweenPlayerId = this.getReaderPlayerId();
    this.clearRevealTimer();
    this.clearAnswerTimer();
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

  /**
   * After break: either advance to the next counted tossup, or replace the current slot
   * when the previous tossup was skipped (does not advance `currentTossupIndex`).
   * @param replacementTossup from QB Reader when `skipNoProgressTossupPending` was set
   */
  /** True while on break after a skip that should not advance the tossup counter. */
  isSkipNoProgressContinuePending(): boolean {
    return this.phase === "between" && this.skipNoProgressTossupPending;
  }

  continueAfterBetween(replacementTossup: TossupDTO | null): void {
    if (this.phase !== "between") return;
    const skipNp = this.skipNoProgressTossupPending;
    this.skipNoProgressTossupPending = false;
    this.lastRoundAnswer = null;
    this.readerBetweenPlayerId = null;
    this.phase = "playing";
    if (skipNp && replacementTossup) {
      this.tossupQueue[this.currentTossupIndex] = replacementTossup;
      this.loadTossupAtCurrentIndex();
      return;
    }
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
      answerDeadlineMs: c.answerDeadlineMs,
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
      buzzCount: p.buzzCount,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      ...(p.avatarDataUrl ? { avatarDataUrl: p.avatarDataUrl } : {}),
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

    const ffaSkipVotes =
      this.phase === "playing" && this.gameMode === "ffa" && this.current?.ffaSkipVotes
        ? [...this.current.ffaSkipVotes]
        : [];
    const ffaSkipVotesNeeded =
      this.phase === "playing" && this.gameMode === "ffa" ? this.players.size : 0;

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
      betweenControlsPlayerId:
        this.phase === "between" ? this.readerBetweenPlayerId : null,
      activePlayerIdA: activeA,
      activePlayerIdB: activeB,
      eligibleBuzzIds: this.eligibleBuzzPlayerIds(),
      ffaSkipVotes,
      ffaSkipVotesNeeded,
    };
  }
}

export type RoomNotify = () => void;
