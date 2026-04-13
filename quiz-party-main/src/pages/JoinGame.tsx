import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/gameStore";
import { ArrowLeft, LogIn } from "lucide-react";

const JoinGame = () => {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const joinGame = useGameStore((s) => s.joinGame);
  const gameCode = useGameStore((s) => s.code);

  const [name, setName] = useState("");
  const [code, setCode] = useState(urlCode?.toUpperCase() || "");

  const handleJoin = () => {
    if (!name.trim() || !code.trim()) return;

    // In a real app this would validate the code against a server
    // For now we just join the local game store
    if (gameCode && code.toUpperCase() === gameCode) {
      joinGame(name.trim());
      navigate(`/lobby/${code.toUpperCase()}`);
    } else {
      // Still navigate — in local mode the host must exist in same browser
      joinGame(name.trim());
      navigate(`/lobby/${code.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center space-y-2">
          <LogIn className="w-10 h-10 text-accent mx-auto" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Join Game</h1>
          <p className="text-muted-foreground font-body text-sm">Enter the game code to join</p>
        </div>

        <div className="game-card p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Code */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Game Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDE"
              maxLength={5}
              className="w-full h-14 rounded-xl bg-muted border border-border text-center font-heading text-2xl font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <Button
            variant="glow"
            size="xl"
            className="w-full"
            onClick={handleJoin}
            disabled={!name.trim() || code.length < 5}
          >
            Join Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
