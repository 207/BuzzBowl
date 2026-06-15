/** Kenney mini animals — keep in sync with client `AVATAR_IDS`. */
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

export function avatarForPlayerIndex(index: number): AvatarId {
  return AVATAR_IDS[Math.max(0, index) % AVATAR_IDS.length];
}

export function parseAvatarId(value: unknown, fallbackIndex: number): AvatarId {
  return isAvatarId(value) ? value : avatarForPlayerIndex(fallbackIndex);
}
