import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HostSetupForm from "@/components/HostSetupForm";
import { difficultyNumbers } from "@/lib/qbreader";
import { getSocket } from "@/lib/socket";
import {
  DEFAULT_HOST_SETUP,
  hostKey,
  setupKey,
  type HostSetupPayload,
  socketSettingsFromHostSetup,
} from "@/lib/roomStorage";
import { ArrowLeft, Crown } from "lucide-react";

const HostGame = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [setup, setSetup] = useState(DEFAULT_HOST_SETUP);
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    setCreating(true);
    const s = getSocket();
    s.once("host_created", (msg: { roomCode: string; hostSecret: string }) => {
      const code = msg.roomCode;
      sessionStorage.setItem(hostKey(code), msg.hostSecret);
      const fullSetup: HostSetupPayload = {
        ...setup,
        hostName: name.trim() || "Host",
      };
      sessionStorage.setItem(setupKey(code), JSON.stringify(fullSetup));

      const diffs = difficultyNumbers(setup.difficulty);
      s.emit("set_game_mode", {
        roomCode: code,
        hostSecret: msg.hostSecret,
        mode: setup.mode === "teams" ? "team" : "ffa",
      });
      s.emit("update_settings", {
        roomCode: code,
        hostSecret: msg.hostSecret,
        settings: socketSettingsFromHostSetup(fullSetup, diffs),
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

          <HostSetupForm value={setup} onChange={setSetup} />

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

export default HostGame;
