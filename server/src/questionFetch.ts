import type { GameSettings, TossupDTO } from "./types.js";
import { fetchOpenTdbPool, qbDifficultiesToOpenTdb } from "./opentdb.js";
import { fetchRandomTossups } from "./qbreader.js";

/**
 * Fetches the question queue for a game (quizbowl via QB Reader or general trivia via OpenTDB).
 * @param poolSize — override how many to pull (e.g. `1` for a single replacement after skip).
 */
export async function fetchTossupPoolForRoom(
  settings: GameSettings,
  poolSize?: number,
): Promise<TossupDTO[]> {
  const n =
    poolSize !== undefined ? Math.max(1, poolSize) : Math.max(settings.questionCount, 8);
  if (settings.questionSource === "opentdb") {
    return fetchOpenTdbPool(n, {
      difficulty: qbDifficultiesToOpenTdb(settings.difficulties),
      categoryId: settings.category.trim() || undefined,
    });
  }
  return fetchRandomTossups({
    number: n,
    difficulties: settings.difficulties,
    category: settings.category,
  });
}
