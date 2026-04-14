import { Home, Trophy } from "lucide-react";
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
  onHome: () => void;
}

export function GameOverScreen({
  variant,
  gameMode,
  teamNames,
  teamScoreA,
  teamScoreB,
  uiPlayers,
  onHome,
}: GameOverScreenProps) {
  const sorted = [...uiPlayers].sort((a, b) => b.score - a.score);
  const isPlayer = variant === "player";

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
          <div className={isPlayer ? "space-y-3" : "space-y-2"}>
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`game-card p-4 flex items-center ${isPlayer ? "gap-4" : "gap-3"} ${
                  i === 0
                    ? isPlayer
                      ? "border-accent/50 glow-accent"
                      : "border-primary/40"
                    : ""
                }`}
              >
                {isPlayer ? (
                  <span className="text-2xl font-heading font-bold text-muted-foreground w-8">#{i + 1}</span>
                ) : null}
                <span className="text-2xl">{p.avatar}</span>
                <span
                  className={
                    isPlayer
                      ? "font-body font-semibold text-foreground flex-1 text-left"
                      : "flex-1 text-left font-body font-medium"
                  }
                >
                  {p.name}
                </span>
                <span
                  className={
                    isPlayer ? "font-heading font-bold text-xl text-primary" : "font-heading font-bold text-primary"
                  }
                >
                  {p.score}
                </span>
              </div>
            ))}
          </div>
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
