export interface QBReaderQuestion {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

const DIFFICULTIES: Record<string, string[]> = {
  easy: ["1", "2"],
  medium: ["3", "4", "5"],
  hard: ["6", "7", "8", "9", "10"],
};

/** Maps host UI preset to QB Reader / server difficulty integers */
export function difficultyNumbers(level: string): number[] {
  const keys = DIFFICULTIES[level] || DIFFICULTIES.easy;
  return keys.map((n) => Number(n));
}

function difficultySetsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
}

/** Maps server difficulty integers back to host UI preset */
export function difficultyLabelFromNumbers(difficulties: number[]): string {
  if (difficulties.length === 0) return "easy";
  if (difficultySetsEqual(difficulties, difficultyNumbers("easy"))) return "easy";
  if (difficultySetsEqual(difficulties, difficultyNumbers("medium"))) return "medium";
  if (difficultySetsEqual(difficulties, difficultyNumbers("hard"))) return "hard";
  const avg = difficulties.reduce((sum, value) => sum + value, 0) / difficulties.length;
  if (avg <= 2.5) return "easy";
  if (avg <= 5) return "medium";
  return "hard";
}

export async function fetchQuestions(
  count: number = 10,
  difficulty: string = "easy",
  category: string = ""
): Promise<QBReaderQuestion[]> {
  const diffs = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
  const params = new URLSearchParams({
    number: String(count),
    difficulties: diffs.join(","),
  });
  if (category) {
    params.set("categories", category);
  }

  try {
    const res = await fetch(
      `https://www.qbreader.org/api/random-tossup?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to fetch questions");
    const data = await res.json();

    return (data.tossups || []).map((t: any) => ({
      question: cleanHTML(t.question_sanitized || t.question || ""),
      answer: cleanHTML(t.answer_sanitized || t.answer || ""),
      category: t.category || "General",
      difficulty: t.difficulty || difficulty,
    }));
  } catch (err) {
    console.error("QBReader API error:", err);
    return getFallbackQuestions(count);
  }
}

function cleanHTML(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function getFallbackQuestions(count: number): QBReaderQuestion[] {
  const fallback: QBReaderQuestion[] = [
    { question: "What is the capital of France?", answer: "Paris", category: "Geography", difficulty: "easy" },
    { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci", category: "Art", difficulty: "easy" },
    { question: "What element has the atomic number 79?", answer: "Gold", category: "Science", difficulty: "medium" },
    { question: "In what year did World War II end?", answer: "1945", category: "History", difficulty: "easy" },
    { question: "What is the largest planet in our solar system?", answer: "Jupiter", category: "Science", difficulty: "easy" },
  ];
  return fallback.slice(0, count);
}

export const CATEGORIES = [
  "Literature",
  "History",
  "Science",
  "Fine Arts",
  "Religion",
  "Mythology",
  "Philosophy",
  "Social Science",
  "Current Events",
  "Geography",
  "Trash",
];
