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
  const data = (await res.json()) as {
    tossups?: Array<
      TossupDTO & {
        category?: string | string[] | null;
      }
    >;
  };
  const list = data.tossups ?? [];
  return list
    .map((t) => {
      const categoryRaw = t.category;
      const category = Array.isArray(categoryRaw)
        ? categoryRaw.join(" / ")
        : typeof categoryRaw === "string"
          ? categoryRaw
          : null;
      return {
        _id: t._id,
        question_sanitized: t.question_sanitized,
        answer_sanitized: t.answer_sanitized,
        category: category?.trim() || null,
      } satisfies TossupDTO;
    })
    .filter((t) => t.question_sanitized && t.answer_sanitized);
}
