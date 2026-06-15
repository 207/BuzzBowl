/** Kenney mini animals — GLB clips shared across all models in this pack. */
export const AVATAR_ANIMATION_CLIPS = [
  "static",
  "idle",
  "walk",
  "run",
  "eat",
  "dance",
  "gesture-positive",
  "gesture-negative",
] as const;

export type AvatarAnimationClip = (typeof AVATAR_ANIMATION_CLIPS)[number];

export const AVATAR_ANIMATION_LABELS: Record<AvatarAnimationClip, string> = {
  static: "Static",
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  eat: "Eat",
  dance: "Dance",
  "gesture-positive": "Gesture +",
  "gesture-negative": "Gesture −",
};

/** Filename suffix after `animal-` (matches `public/models/animals/animal-{id}.glb`). */
export const AVATAR_IDS = [
  "bee",
  "beaver",
  "bunny",
  "cat",
  "caterpillar",
  "chick",
  "cow",
  "crab",
  "deer",
  "dog",
  "elephant",
  "fish",
  "fox",
  "giraffe",
  "hog",
  "koala",
  "lion",
  "monkey",
  "panda",
  "parrot",
  "penguin",
  "pig",
  "polar",
  "tiger",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

const AVATAR_ID_SET = new Set<string>(AVATAR_IDS);

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATAR_ID_SET.has(value);
}

const MODEL_BASE = "/models/animals";

export function avatarModelUrl(id: AvatarId): string {
  return `${MODEL_BASE}/animal-${id}.glb`;
}

export function avatarDisplayName(id: AvatarId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function avatarForPlayerIndex(index: number): AvatarId {
  return AVATAR_IDS[Math.max(0, index) % AVATAR_IDS.length];
}

export function avatarIdForPlayerId(
  players: { id: string; avatarId?: string }[],
  playerId: string,
): AvatarId {
  const player = players.find((p) => p.id === playerId);
  if (player?.avatarId && isAvatarId(player.avatarId)) return player.avatarId;
  const i = Math.max(0, players.findIndex((p) => p.id === playerId));
  return avatarForPlayerIndex(i);
}

export function podiumAnimationClip(place: 1 | 2 | 3): AvatarAnimationClip {
  if (place === 1) return "dance";
  if (place === 2) return "run";
  return "walk";
}
