import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/gameStore";
import GameCodeDisplay from "@/components/GameCodeDisplay";
import PlayerList from "@/components/PlayerList";
import { Play, ArrowLeft } from "lucide-react";

const Lobby = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const gameState = useGameStore();

  const isHost = gameState.players.length > 0 && gameState.players[0].id === "host";

  const handleStart = () => {
    gameState.startGame();
    navigate(`/play/${code}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <button
          onClick={() => {
            gameState.resetGame();
            navigate("/");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">Game Lobby</h1>
          <p className="text-muted-foreground font-body text-sm">
            {gameState.mode === "teams" ? "Teams Mode" : "Free For All"} · {gameState.difficulty} difficulty
          </p>
        </div>

        <GameCodeDisplay code={code || ""} />

        <PlayerList players={gameState.players} mode={gameState.mode} />

        {isHost && (
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleStart}
            disabled={gameState.players.length < 1}
          >
            <Play className="w-5 h-5" />
            Start Game ({gameState.players.length} player{gameState.players.length !== 1 ? "s" : ""})
          </Button>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-body animate-pulse">
              Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
