import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { compressSelfieFile } from "@/lib/compressSelfie";
import { getSocket } from "@/lib/socket";
import { playerKey } from "@/lib/roomStorage";
import { ArrowLeft, Camera, LogIn, X } from "lucide-react";

const JoinGame = () => {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();

  const [name, setName] = useState("");
  const [code, setCode] = useState(urlCode?.toUpperCase() || "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieBusy, setSelfieBusy] = useState(false);

  const handleJoin = () => {
    const c = code.trim().toUpperCase();
    if (!name.trim() || c.length < 4) return;
    setBusy(true);
    setError(null);
    const s = getSocket();
    s.emit(
      "player_join",
      {
        roomCode: c,
        nickname: name.trim() || "Player",
        ...(selfie ? { avatarDataUrl: selfie } : {}),
      },
      (res: { error?: string; playerId?: string }) => {
        setBusy(false);
        if (res.error) {
          if (res.error === "room_not_found") setError("Room not found.");
          else if (res.error === "game_already_started")
            setError("Game already started.");
          else setError("Could not join.");
          return;
        }
        if (res.playerId) {
          sessionStorage.setItem(playerKey(c), res.playerId);
          navigate(`/lobby/${c}`);
        }
      },
    );
  };

  const onPickSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setSelfieBusy(true);
    try {
      const dataUrl = await compressSelfieFile(file);
      if (!dataUrl) setError("Photo: could not use that image — try another or skip.");
      else {
        setError(null);
        setSelfie(dataUrl);
      }
    } finally {
      setSelfieBusy(false);
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
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={24}
              className="w-full h-12 rounded-xl bg-muted border border-border px-4 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Selfie (optional)</label>
            <p className="text-xs text-muted-foreground font-body">
              Shown on the host screen next to your name. Skipped if you prefer not to.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-body font-medium text-foreground hover:bg-muted transition-colors">
                <Camera className="h-4 w-4" />
                {selfieBusy ? "Processing…" : "Add photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  disabled={selfieBusy}
                  onChange={onPickSelfie}
                />
              </label>
              {selfie ? (
                <button
                  type="button"
                  onClick={() => setSelfie(null)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-body text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
            </div>
            {selfie ? (
              <div className="flex justify-center pt-1">
                <img
                  src={selfie}
                  alt="Your preview"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/30"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-foreground">Game Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full h-14 rounded-xl bg-muted border border-border text-center font-heading text-2xl font-bold tracking-[0.2em] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error ? <p className="text-sm text-destructive font-body">{error}</p> : null}

          <Button
            variant="glow"
            size="xl"
            className="w-full"
            onClick={handleJoin}
            disabled={!name.trim() || code.trim().length < 4 || busy || selfieBusy}
          >
            Join Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
