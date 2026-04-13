import type { TossupDTO } from "./types.js";

const BASE = "https://qbreader.org/api";

export async function fetchRandomTossups(params: {
  number: number;
  difficulties: number[];
  category: string;
}): Promise<TossupDTO[]> {
  const url = new URL(`${BASE}/random-tossup`);
  url.searchParams.set("number", String(Math.min(50, Math.max(1, params.number))));
  if (params.difficulties.length > 0) {
    url.searchParams.set("difficulties", params.difficulties.join(","));
  }
  if (params.category.trim()) {
    url.searchParams.set("categories", params.category.trim());
  }

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QB Reader ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { tossups?: TossupDTO[] };
  const list = data.tossups ?? [];
  return list.filter((t) => t.question_sanitized && t.answer_sanitized);
}
