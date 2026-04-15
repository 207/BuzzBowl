export function hostKey(roomCode: string): string {
  return `buzzbowl_host_${roomCode.trim().toUpperCase()}`;
}

export function playerKey(roomCode: string): string {
  return `buzzbowl_player_${roomCode.trim().toUpperCase()}`;
}

export function setupKey(roomCode: string): string {
  return `buzzbowl_setup_${roomCode.trim().toUpperCase()}`;
}

export const DEFAULT_HOST_ADVANCED = {
  correctMidRevealPoints: 10,
  correctFullRevealPoints: 10,
  negPoints: 5,
  answerCountdownSeconds: 5,
} as const;

export interface HostSetupPayload {
  mode: "ffa" | "teams";
  playMode: "house" | "remote";
  difficulty: string;
  category: string;
  questionCount: number;
  hostName: string;
  correctMidRevealPoints: number;
  correctFullRevealPoints: number;
  negPoints: number;
  answerCountdownSeconds: number;
}

/** Normalized setup with defaults for older session payloads. */
export function readHostSetup(code: string): HostSetupPayload | null {
  try {
    const raw = sessionStorage.getItem(setupKey(code));
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<HostSetupPayload>;
    const mid =
      typeof o.correctMidRevealPoints === "number"
        ? o.correctMidRevealPoints
        : DEFAULT_HOST_ADVANCED.correctMidRevealPoints;
    const full =
      typeof o.correctFullRevealPoints === "number"
        ? o.correctFullRevealPoints
        : DEFAULT_HOST_ADVANCED.correctFullRevealPoints;
    return {
      mode: o.mode === "teams" || o.mode === "ffa" ? o.mode : "ffa",
      playMode: o.playMode === "remote" ? "remote" : "house",
      difficulty: typeof o.difficulty === "string" ? o.difficulty : "easy",
      category: typeof o.category === "string" ? o.category : "",
      questionCount:
        typeof o.questionCount === "number" && o.questionCount >= 1 ? o.questionCount : 10,
      hostName: typeof o.hostName === "string" ? o.hostName : "Host",
      correctMidRevealPoints: mid,
      correctFullRevealPoints: full,
      negPoints:
        typeof o.negPoints === "number" ? o.negPoints : DEFAULT_HOST_ADVANCED.negPoints,
      answerCountdownSeconds:
        typeof o.answerCountdownSeconds === "number"
          ? o.answerCountdownSeconds
          : DEFAULT_HOST_ADVANCED.answerCountdownSeconds,
    };
  } catch {
    return null;
  }
}

/** Payload for `update_settings` / `start_game` (server GameSettings subset + difficulties). */
export function socketSettingsFromHostSetup(
  setup: HostSetupPayload,
  difficulties: number[],
) {
  return {
    questionCount: setup.questionCount,
    playMode: setup.playMode,
    category: setup.category.trim(),
    difficulties,
    correctPoints: setup.correctFullRevealPoints,
    correctMidRevealPoints: setup.correctMidRevealPoints,
    negPoints: setup.negPoints,
    answerCountdownSeconds: setup.answerCountdownSeconds,
  };
}
