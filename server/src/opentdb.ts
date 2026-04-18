import { customAlphabet } from "nanoid";
import type { TossupDTO } from "./types.js";

const genOtdbId = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 12);

const OTDB_API = "https://opentdb.com/api.php";

/** Map host QB-style difficulty integers to OpenTDB’s difficulty filter. */
export function qbDifficultiesToOpenTdb(
  difficulties: number[],
): "easy" | "medium" | "hard" | undefined {
  if (difficulties.length === 0) return undefined;
  const max = Math.max(...difficulties);
  if (max <= 2) return "easy";
  if (max <= 5) return "medium";
  return "hard";
}

function decodeOtdbField(raw: string): string {
  let s = raw.replace(/\+/g, " ");
  try {
    s = decodeURIComponent(s);
  } catch {
    /* ignore */
  }
  return decodeHtmlEntities(s);
}

function charFromCode(code: number): string {
  if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return "\ufffd";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "\ufffd";
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? charFromCode(code) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? charFromCode(code) : _;
    })
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

type OtdbApiResult = {
  response_code: number;
  results?: Array<{
    type: string;
    question: string;
    correct_answer: string;
  }>;
};

async function fetchOpenTdbBatch(
  amount: number,
  opts: { difficulty?: "easy" | "medium" | "hard"; categoryId?: string },
): Promise<TossupDTO[]> {
  const url = new URL(OTDB_API);
  url.searchParams.set("amount", String(Math.min(50, Math.max(1, amount))));
  url.searchParams.set("type", "multiple");
  if (opts.difficulty) url.searchParams.set("difficulty", opts.difficulty);
  if (opts.categoryId) url.searchParams.set("category", opts.categoryId);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenTDB ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as OtdbApiResult;
  if (data.response_code !== 0) {
    if (data.response_code === 1) return [];
    throw new Error(`OpenTDB response_code ${data.response_code}`);
  }
  const list = data.results ?? [];
  const out: TossupDTO[] = [];
  for (const r of list) {
    if (r.type !== "multiple") continue;
    const q = decodeOtdbField(r.question).trim();
    const a = decodeOtdbField(r.correct_answer).trim();
    if (!q || !a) continue;
    out.push({
      _id: `otdb-${genOtdbId()}`,
      question_sanitized: q,
      answer_sanitized: a,
    });
  }
  return out;
}

/**
 * Pulls multiple-choice-only questions (no true/false). Wrong answers are omitted;
 * only the question stem and correct answer are used like quizbowl tossups.
 */
export async function fetchOpenTdbPool(
  amount: number,
  opts: { difficulty?: "easy" | "medium" | "hard"; categoryId?: string },
): Promise<TossupDTO[]> {
  const target = Math.max(1, Math.min(50, amount));
  const seen = new Set<string>();
  const out: TossupDTO[] = [];

  let categoryId = opts.categoryId;
  let difficulty = opts.difficulty;
  let attempts = 0;

  while (out.length < target && attempts < 15) {
    attempts += 1;
    if (attempts > 1) await new Promise((r) => setTimeout(r, 400));
    const before = out.length;
    const batch = await fetchOpenTdbBatch(Math.min(50, target - out.length + 5), {
      difficulty,
      categoryId,
    });
    for (const t of batch) {
      const key = `${t.question_sanitized}\0${t.answer_sanitized}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
      if (out.length >= target) break;
    }

    if (out.length >= target) break;

    if (batch.length === 0 || out.length === before) {
      if (categoryId) {
        categoryId = undefined;
        continue;
      }
      if (difficulty) {
        difficulty = undefined;
        continue;
      }
      break;
    }
  }

  return out.slice(0, target);
}
