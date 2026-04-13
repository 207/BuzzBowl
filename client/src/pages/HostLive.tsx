import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useServerGameState } from "@/hooks/useServerGameState";
import { getSocket } from "@/lib/socket";
import { hostKey } from "@/lib/roomStorage";
import { toast } from "sonner";
import { Pause, Play, SkipForward, Check, X, FastForward } from "lucide-react";
import PlayerList from "@/components/PlayerList";
import { mapServerPlayers } from "@/lib/gameTypes";

const HostLive = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const hostSecret = useMemo(() => (code ? sessionStorage.getItem(hostKey(code)) : null), [code]);
  const state = useServerGameState(code);

  useEffect(() => {
    if (!code || !hostSecret) {
      toast.error("Missing host key — open the lobby from this device.");
      navigate("/");
      return;
    }
    const s = getSocket();
    s.emit("host_join", { roomCode: code, hostSecret }, (res: { error?: string }) => {
      if (res?.error) toast.error("Could not join as host.");
    });
  }, [code, hostSecret, navigate]);

  useEffect(() => {
    if (state?.phase === "lobby") navigate(`/lobby/${code}`);
  }, [state?.phase, code, navigate]);

  const emit = (event: string, payload: Record<string, unknown> = {}) => {
    if (!code || !hostSecret) return;
    getSocket().emit(event, { roomCode: code, hostSecret, ...payload });
  };

  if (!code || !hostSecret) return null;

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Connecting…</p>
      </div>
    );
  }

  const uiMode = state.gameMode === "team" ? "teams" : "ffa";
  const uiPlayers = mapServerPlayers(state.players, state.gameMode);

  if (state.phase === "ended") {
    const sorted = [...uiPlayers].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6 text-center">
          <h1 className="text-4xl font-heading font-extrabold text-gradient">Game Over</h1>
          {state.gameMode === "team" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="game-card p-4">
                <p className="text-sm text-muted-foreground">{state.teamNames.A}</p>
                <p className="text-3xl font-heading font-bold text-primary">{state.teamScoreA}</p>
              </div>
              <div className="game-card p-4">
                <p className="text-sm text-muted-foreground">{state.teamNames.B}</p>
                <p className="text-3xl font-heading font-bold text-accent">{state.teamScoreB}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((p, i) => (
                <div
                  key={p.id}
                  className={`game-card p-4 flex items-center gap-3 ${i === 0 ? "border-primary/40" : ""}`}
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="flex-1 text-left font-body font-medium">{p.name}</span>
                  <span className="font-heading font-bold text-primary">{p.score}</span>
                </div>
              ))}
            </div>
          )}
          <Button variant="hero" size="xl" className="w-full" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "between") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8">
        <h2 className="text-2xl font-heading font-bold text-foreground">Break</h2>
        {state.answer ? (
          <div className="game-card max-w-2xl w-full p-6 text-center">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Previous answer</p>
            <p className="mt-2 text-lg font-heading text-accent">{state.answer}</p>
          </div>
        ) : null}
        <PlayerList players={uiPlayers} mode={uiMode} />
        <Button variant="hero" size="xl" onClick={() => emit("continue_game")}>
          <FastForward className="w-5 h-5" />
          Next tossup
        </Button>
      </div>
    );
  }

  if (state.phase === "playing" && state.tossup) {
    const t = state.tossup;
    return (
      <div className="min-h-screen flex flex-col px-4 py-8 max-w-4xl mx-auto w-full gap-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground font-body">
          <span>
            Tossup {state.currentTossupIndex + 1} / {state.totalTossups}
          </span>
          <span>
            Reader:{" "}
            <span className="text-foreground font-medium">
              {state.readerPlayerId
                ? state.players.find((p) => p.id === state.readerPlayerId)?.nickname ?? "—"
                : "—"}
            </span>
          </span>
          {state.gameMode === "team" && (
            <span>
              {state.players.find((p) => p.id === state.activePlayerIdA)?.nickname ?? "—"} vs{" "}
              {state.players.find((p) => p.id === state.activePlayerIdB)?.nickname ?? "—"}
            </span>
          )}
        </div>

        <div className="game-card p-8 min-h-[12rem]">
          <p className="text-xl md:text-2xl font-body leading-relaxed text-foreground">
            {t.revealedText}
            {!t.revealComplete ? <span className="text-muted-foreground"> ▌</span> : null}
          </p>
          {t.revealPaused ? (
            <p className="mt-4 text-sm text-primary font-body">Paused</p>
          ) : null}
        </div>

        {t.buzzPhase === "locked" && (
          <div className="game-card p-5 border-border/60">
            <p className="text-sm text-muted-foreground font-body">
              Printed answer is on the <span className="text-foreground font-semibold">reader&apos;s phone</span> until
              this tossup ends (shown here on the break screen).
            </p>
            <p className="mt-3 text-sm text-muted-foreground font-body">
              Buzzed: <span className="text-foreground font-semibold">{t.buzzWinnerName}</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" onClick={() => emit("pause_reveal")}>
            <Pause className="w-4 h-4" />
            Pause
          </Button>
          <Button variant="outline" size="lg" onClick={() => emit("resume_reveal")}>
            <Play className="w-4 h-4" />
            Resume
          </Button>
          <Button variant="outline" size="lg" onClick={() => emit("show_full_question")}>
            Show full
          </Button>
        </div>

        {t.buzzPhase === "locked" && (
          <div className="flex flex-wrap gap-3">
            <Button variant="default" size="xl" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => emit("mark_correct")}>
              <Check className="w-5 h-5" />
              Correct
            </Button>
            <Button variant="destructive" size="xl" onClick={() => emit("mark_incorrect")}>
              <X className="w-5 h-5" />
              Incorrect
            </Button>
            <Button variant="glow" size="xl" onClick={() => emit("skip_question")}>
              <SkipForward className="w-5 h-5" />
              Skip
            </Button>
          </div>
        )}

        <PlayerList players={uiPlayers} mode={uiMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground font-body">Waiting…</p>
    </div>
  );
};

export default HostLive;
