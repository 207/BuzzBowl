import type { ServerGameMode, ServerPlayer } from "@/types/serverGame";

function topPlayersByScore(players: ServerPlayer[], n: number): ServerPlayer[] {
  return [...players].sort((a, b) => b.score - a.score).slice(0, n);
}

const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉");

export function BreakTopThree({
  players,
  gameMode,
  scale = "normal",
}: {
  players: ServerPlayer[];
  gameMode: ServerGameMode;
  scale?: "normal" | "tv";
}) {
  const tv = scale === "tv";
  const top = topPlayersByScore(players, 3);
  if (top.length === 0) return null;

  return (
    <div className={`w-full ${tv ? "max-w-2xl" : "max-w-md"}`}>
      <p
        className={`mb-2 text-center font-body font-semibold uppercase tracking-wider text-muted-foreground ${
          tv ? "mb-4 text-base" : "text-xs"
        }`}
      >
        Top scores
      </p>
      <ul className="game-card divide-y divide-border/60 overflow-hidden p-0">
        {top.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between gap-3 text-left font-body ${
              tv ? "px-6 py-4 text-lg" : "px-4 py-3 text-sm"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              <span className="shrink-0 text-base" aria-hidden>
                {medal(i)}
              </span>
              <span className="truncate font-medium">{p.nickname}</span>
              {gameMode === "team" && p.team ? (
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {p.team}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-primary">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
