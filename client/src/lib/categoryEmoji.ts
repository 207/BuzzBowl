const QUIZBOWL_CATEGORY_EMOJI: Array<{ match: RegExp; emoji: string }> = [
  { match: /literature|novel|poetry|drama/i, emoji: "📚" },
  { match: /history|histor/i, emoji: "🏛️" },
  { match: /science|physics|chemistry|biology|math/i, emoji: "🔬" },
  { match: /fine arts|art|painting|music|opera/i, emoji: "🎨" },
  { match: /religion|mythology/i, emoji: "🕊️" },
  { match: /philosophy/i, emoji: "🤔" },
  { match: /social science|economics|psychology|sociology/i, emoji: "🌐" },
  { match: /current events|current event/i, emoji: "📰" },
  { match: /geography/i, emoji: "🌍" },
  { match: /trash|pop culture|sports/i, emoji: "🎬" },
];

export const QUIZBOWL_CATEGORY_EMOJIS = QUIZBOWL_CATEGORY_EMOJI.map((c) => c.emoji);

export function quizbowlCategoryEmoji(category: string | null): string {
  if (!category) return "❓";
  for (const { match, emoji } of QUIZBOWL_CATEGORY_EMOJI) {
    if (match.test(category)) return emoji;
  }
  return "❓";
}
