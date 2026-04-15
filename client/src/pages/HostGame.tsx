import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GameMode } from "@/lib/gameTypes";
import { CATEGORIES, difficultyNumbers } from "@/lib/qbreader";
import { getSocket } from "@/lib/socket";
import {
  DEFAULT_HOST_ADVANCED,
  hostKey,
  setupKey,
  type HostSetupPayload,
  socketSettingsFromHostSetup,
} from "@/lib/roomStorage";
import { ArrowLeft, ChevronDown, Crown, Users, Swords } from "lucide-react";

const HostGame = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mode, setMode] = useState<GameMode>("ffa");
  const [difficulty, setDifficulty] = useState("easy");
  const [category, setCategory] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [creating, setCreating] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [correctMidRevealPoints, setCorrectMidRevealPoints] = useState(
    DEFAULT_HOST_ADVANCED.correctMidRevealPoints,
  );
  const [correctFullRevealPoints, setCorrectFullRevealPoints] = useState(
    DEFAULT_HOST_ADVANCED.correctFullRevealPoints,
  );
  const [negPoints, setNegPoints] = useState(DEFAULT_HOST_ADVANCED.negPoints);
  const [answerCountdownSeconds, setAnswerCountdownSeconds] = useState(
    DEFAULT_HOST_ADVANCED.answerCountdownSeconds,
  );

  const handleCreate = () => {
    setCreating(true);
    const s = getSocket();
    s.once("host_created", (msg: { roomCode: string; hostSecret: string }) => {
      const code = msg.roomCode;
      sessionStorage.setItem(hostKey(code), msg.hostSecret);
      const setup: HostSetupPayload = {
        mode,
        difficulty,
        category,
        questionCount,
        hostName: name.trim() || "Host",
        correctMidRevealPoints,
        correctFullRevealPoints,
        negPoints,
        answerCountdownSeconds,
      };
      sessionStorage.setItem(setupKey(code), JSON.stringify(setup));

      const diffs = difficultyNumbers(difficulty);
      s.emit("set_game_mode", {
        roomCode: code,
        hostSecret: msg.hostSecret,
        mode: mode === "teams" ? "team" : "ffa",
      });
      s.emit("update_settings", {
        roomCode: code,
        hostSecret: msg.hostSecret,
        settings: socketSettingsFromHostSetup(setup, diffs),
      });

      setCreating(false);
      navigate(`/lobby/${code}`);
    });
    s.emit("create_room");
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
          <Crown className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Host a Game</h1>
          <p className="text-muted-foreground font-body text-sm">Set up a BuzzBowl room</p>
        </div>

        <div className="game-card p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Your Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Host"
              maxLength={20}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  type="button"
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

          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Tossups in game</label>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) || 10)}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm font-body font-medium text-foreground hover:bg-muted/60 transition-colors">
              Advanced settings
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-body font-medium text-foreground">
                  Points (interrupt — mid question)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={correctMidRevealPoints}
                  onChange={(e) => setCorrectMidRevealPoints(Number(e.target.value) || 0)}
                  className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground font-body">
                  Awarded when the reader marks a buzz correct before the full tossup is revealed.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-body font-medium text-foreground">
                  Points (after full question)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={correctFullRevealPoints}
                  onChange={(e) => setCorrectFullRevealPoints(Number(e.target.value) || 0)}
                  className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-body font-medium text-foreground">
                  Negative points (wrong on interrupt)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={negPoints}
                  onChange={(e) => setNegPoints(Number(e.target.value) || 0)}
                  className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground font-body">
                  Subtracted when wrong before the full question is shown (same rules as before for
                  team vs FFA).
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-body font-medium text-foreground">
                  Answer countdown (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={answerCountdownSeconds}
                  onChange={(e) => setAnswerCountdownSeconds(Number(e.target.value) || 0)}
                  className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground font-body">
                  After a buzz, time before an automatic incorrect (0 = off). Reader can still judge
                  sooner.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create Game"}
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
    type="button"
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
