import { Home, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/gameTypes";
import type { ServerGameMode } from "@/types/serverGame";

export type GameOverVariant = "player" | "host";

export interface GameOverScreenProps {
  variant: GameOverVariant;
  gameMode: ServerGameMode;
  teamNames: { A: string; B: string };
  teamScoreA: number;
  teamScoreB: number;
  uiPlayers: Player[];
  onRestart?: () => void;
  onHome: () => void;
}

export function GameOverScreen({
  variant,
  gameMode,
  teamNames,
  teamScoreA,
  teamScoreB,
  uiPlayers,
  onRestart,
  onHome,
}: GameOverScreenProps) {
  const sorted = [...uiPlayers].sort((a, b) => b.score - a.score);
  const isPlayer = variant === "player";
  const podium = sorted.slice(0, 3);
  const remaining = sorted.slice(3);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={`w-full space-y-6 text-center ${isPlayer ? "max-w-md" : "max-w-lg"}`}>
        {isPlayer ? (
          <Trophy className="w-16 h-16 text-accent mx-auto animate-float" />
        ) : null}
        <h1 className="text-4xl font-heading font-extrabold text-gradient">
          {isPlayer ? "Game Over!" : "Game Over"}
        </h1>
        {gameMode === "team" ? (
          <div className={`grid grid-cols-2 ${isPlayer ? "gap-3" : "gap-4"}`}>
            <div className="game-card p-4">
              <p className={isPlayer ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                {teamNames.A}
              </p>
              <p
                className={
                  isPlayer
                    ? "text-2xl font-heading font-bold text-primary"
                    : "text-3xl font-heading font-bold text-primary"
                }
              >
                {teamScoreA}
              </p>
            </div>
            <div className="game-card p-4">
              <p className={isPlayer ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                {teamNames.B}
              </p>
              <p
                className={
                  isPlayer
                    ? "text-2xl font-heading font-bold text-accent"
                    : "text-3xl font-heading font-bold text-accent"
                }
              >
                {teamScoreB}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 items-end">
              {[1, 0, 2].map((idx) => {
                const p = podium[idx];
                if (!p) return <div key={`podium-${idx}`} />;
                const place = idx + 1;
                const h =
                  place === 1 ? "h-36" : place === 2 ? "h-28" : "h-24";
                return (
                  <div
                    key={p.id}
                    className={`game-card group relative ${h} p-3 flex flex-col justify-end items-center ${
                      place === 1 ? "border-primary/50 glow-primary" : ""
                    }`}
                    title={`🐝 ${p.stats.buzzed} · Correct: ${p.stats.correct} · Wrong: ${p.stats.wrong}`}
                  >
                    <div className="text-2xl">{p.avatar}</div>
                    <div className="mt-1 text-xs text-muted-foreground">#{place}</div>
                    <div className="text-sm font-body font-semibold truncate max-w-full">{p.name}</div>
                    <div className="text-lg font-heading font-bold text-primary">{p.score}</div>
                    <div className="absolute -top-10 hidden group-hover:flex whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground shadow-lg">
                      🐝 {p.stats.buzzed} · ✅ {p.stats.correct} · ❌ {p.stats.wrong}
                    </div>
                  </div>
                );
              })}
            </div>
            {remaining.length > 0 && (
              <div className="space-y-2">
                {remaining.map((p, i) => (
                  <div
                    key={p.id}
                    className="game-card group relative p-3 flex items-center gap-3"
                    title={`🐝 ${p.stats.buzzed} · Correct: ${p.stats.correct} · Wrong: ${p.stats.wrong}`}
                  >
                    <span className="text-sm font-heading font-bold text-muted-foreground w-8">#{i + 4}</span>
                    <span className="text-xl">{p.avatar}</span>
                    <span className="flex-1 text-left font-body font-medium">{p.name}</span>
                    <span className="font-heading font-bold text-primary">{p.score}</span>
                    <div className="absolute -top-10 right-2 hidden group-hover:flex whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground shadow-lg">
                      🐝 {p.stats.buzzed} · ✅ {p.stats.correct} · ❌ {p.stats.wrong}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {!isPlayer && onRestart && (
          <Button variant="outline" size="xl" className="w-full gap-2" onClick={onRestart}>
            <RotateCcw className="w-5 h-5" />
            Restart with same players
          </Button>
        )}
        <Button
          variant="hero"
          size="xl"
          className={isPlayer ? "w-full gap-2" : "w-full"}
          onClick={onHome}
        >
          {isPlayer ? (
            <>
              <Home className="w-5 h-5" />
              Home
            </>
          ) : (
            "Home"
          )}
        </Button>
      </div>
    </div>
  );
}
