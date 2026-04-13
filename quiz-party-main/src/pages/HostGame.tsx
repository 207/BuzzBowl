import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore, GameMode } from "@/lib/gameStore";
import { CATEGORIES } from "@/lib/qbreader";
import { ArrowLeft, Crown, Users, Swords } from "lucide-react";

const HostGame = () => {
  const navigate = useNavigate();
  const createGame = useGameStore((s) => s.createGame);
  const code = useGameStore((s) => s.code);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<GameMode>("ffa");
  const [difficulty, setDifficulty] = useState("easy");
  const [category, setCategory] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createGame(name.trim(), mode, difficulty, category);
  };

  // Redirect to lobby once game is created
  if (code) {
    navigate(`/lobby/${code}`);
    return null;
  }

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
          <Crown className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Host a Game</h1>
          <p className="text-muted-foreground font-body text-sm">Set up your trivia session</p>
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

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Game Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <ModeButton
                active={mode === "ffa"}
                onClick={() => setMode("ffa")}
                icon={<Swords className="w-5 h-5" />}
                label="Free For All"
              />
              <ModeButton
                active={mode === "teams"}
                onClick={() => setMode("teams")}
                icon={<Users className="w-5 h-5" />}
                label="Teams"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`h-10 rounded-lg font-body text-sm font-medium capitalize transition-all ${
                    difficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create Game
          </Button>
        </div>
      </div>
    </div>
  );
};

const ModeButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 h-12 rounded-xl font-body text-sm font-medium transition-all ${
      active
        ? "bg-primary text-primary-foreground glow-primary"
        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default HostGame;
