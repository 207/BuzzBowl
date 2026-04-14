import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useServerGameState } from "@/hooks/useServerGameState";
import { mapServerPlayers } from "@/lib/gameTypes";
import { getSocket } from "@/lib/socket";
import { playerKey } from "@/lib/roomStorage";
import { Home, Trophy, Pause, Play, SkipForward, Check, X, FastForward, Maximize2 } from "lucide-react";

const PlayGame = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const [playerId, setPlayerId] = useState<string | null>(() =>
    code ? sessionStorage.getItem(playerKey(code)) : null,
  );
  const state = useServerGameState(code);

  useEffect(() => {
    if (!code) return;
    const id = sessionStorage.getItem(playerKey(code));
    setPlayerId(id);
  }, [code]);

  useEffect(() => {
    if (!code || !playerId) return;
    const s = getSocket();
    s.emit("player_identify", { roomCode: code, playerId }, () => {});
  }, [code, playerId]);

  useEffect(() => {
    if (state?.phase === "lobby") navigate(`/lobby/${code}`);
  }, [state?.phase, code, navigate]);

  const me = useMemo(
    () => state?.players.find((p) => p.id === playerId),
    [state?.players, playerId],
  );

  const readerEmit = (event: string) => {
    if (!code || !playerId) return;
    getSocket().emit(event, { roomCode: code, playerId });
  };

  const buzz = () => {
    if (!code || !playerId) return;
    try {
      navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
    getSocket().emit("buzz", { roomCode: code, playerId });
  };

  if (!code) {
    return <p className="p-6 text-foreground">Invalid room.</p>;
  }

  if (!playerId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground font-body text-center">Join this room first.</p>
        <Button variant="hero" onClick={() => navigate(`/join/${code}`)}>
          Join game
        </Button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Connecting…</p>
      </div>
    );
  }

  if (state.phase === "ended") {
    const uiPlayers = mapServerPlayers(state.players, state.gameMode);
    const sorted = [...uiPlayers].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <Trophy className="w-16 h-16 text-accent mx-auto animate-float" />
          <h1 className="text-4xl font-heading font-extrabold text-gradient">Game Over!</h1>
          {state.gameMode === "team" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="game-card p-4">
                <p className="text-xs text-muted-foreground">{state.teamNames.A}</p>
                <p className="text-2xl font-heading font-bold text-primary">{state.teamScoreA}</p>
              </div>
              <div className="game-card p-4">
                <p className="text-xs text-muted-foreground">{state.teamNames.B}</p>
                <p className="text-2xl font-heading font-bold text-accent">{state.teamScoreB}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((p, i) => (
                <div
                  key={p.id}
                  className={`game-card p-4 flex items-center gap-4 ${i === 0 ? "border-accent/50 glow-accent" : ""}`}
                >
                  <span className="text-2xl font-heading font-bold text-muted-foreground w-8">#{i + 1}</span>
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-body font-semibold text-foreground flex-1 text-left">{p.name}</span>
                  <span className="font-heading font-bold text-xl text-primary">{p.score}</span>
                </div>
              ))}
            </div>
          )}
          <Button variant="hero" size="xl" className="w-full" onClick={() => navigate("/")}>
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "between") {
    const canAdvance = state.betweenControlsPlayerId === playerId;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-heading text-foreground">Round break</p>
        {state.answer ? (
          <div className="game-card w-full max-w-md p-5">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Previous answer</p>
            <p className="mt-2 text-base font-heading text-accent">{state.answer}</p>
          </div>
        ) : null}
        {state.gameMode === "ffa" && (
          <p className="font-mono text-2xl text-primary">{me?.score ?? 0} pts</p>
        )}
        {state.gameMode === "team" && (
          <p className="text-muted-foreground font-body text-sm">
            {state.teamNames.A} {state.teamScoreA} — {state.teamScoreB} {state.teamNames.B}
          </p>
        )}
        {canAdvance ? (
          <Button variant="hero" size="xl" className="w-full max-w-sm" onClick={() => readerEmit("continue_game")}>
            <FastForward className="w-5 h-5" />
            Next tossup
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            Waiting for the reader to start the next tossup…
          </p>
        )}
      </div>
    );
  }

  if (state.phase === "playing" && state.tossup) {
    const t = state.tossup;
    const imReader = state.readerPlayerId === playerId;
    const eligible = state.eligibleBuzzIds?.includes(playerId) ?? false;
    const canBuzz = t.buzzPhase === "open" && eligible;
    const iBuzzed = t.buzzPhase === "locked" && t.buzzWinnerId === playerId;
    const watching = state.gameMode === "team" && !eligible && !iBuzzed && !imReader;

    const revealToggleDisabled = t.revealComplete;
    const revealToggleLabel = t.revealComplete ? "Reveal done" : t.revealPaused ? "Resume" : "Pause";

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="border-b border-border px-4 py-3 text-center text-sm text-muted-foreground font-body">
          {state.gameMode === "team" ? (
            <span>
              {state.teamNames.A} {state.teamScoreA} — {state.teamScoreB} {state.teamNames.B}
            </span>
          ) : (
            <span className="text-primary font-semibold">Your score: {me?.score ?? 0}</span>
          )}
        </div>
        {imReader && (
          <p className="bg-primary/15 px-4 py-2 text-center text-sm font-body text-primary font-medium">
            You&apos;re reading — run controls below (buzzer off)
          </p>
        )}
        {watching && (
          <p className="bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
            Watching this matchup — buzzer off
          </p>
        )}
        {imReader && state.answer ? (
          <div className="mx-4 mt-4 game-card border-primary/30 p-5">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Answer line</p>
            <p className="mt-2 text-lg font-heading text-accent leading-snug">{state.answer}</p>
          </div>
        ) : null}

        {imReader && (
          <div className="mx-4 mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="lg"
                disabled={revealToggleDisabled}
                className={revealToggleDisabled ? "opacity-50" : ""}
                onClick={() => {
                  if (revealToggleDisabled) return;
                  if (t.revealPaused) readerEmit("resume_reveal");
                  else readerEmit("pause_reveal");
                }}
              >
                {t.revealPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {revealToggleLabel}
              </Button>
              <Button variant="outline" size="lg" onClick={() => readerEmit("show_full_question")}>
                <Maximize2 className="w-4 h-4" />
                Show full
              </Button>
            </div>
            {t.buzzPhase === "locked" && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="default"
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => readerEmit("mark_correct")}
                >
                  <Check className="w-5 h-5" />
                  Correct
                </Button>
                <Button variant="destructive" size="lg" onClick={() => readerEmit("mark_incorrect")}>
                  <X className="w-5 h-5" />
                  Incorrect
                </Button>
                <Button variant="glow" size="lg" onClick={() => readerEmit("skip_question")}>
                  <SkipForward className="w-5 h-5" />
                  Skip
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-12">
          {iBuzzed ? (
            <p className="text-3xl font-heading font-bold text-primary">You buzzed!</p>
          ) : canBuzz ? (
            <button
              type="button"
              onClick={buzz}
              className="h-52 w-full max-w-sm rounded-full bg-emerald-600 text-3xl font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-900/40 active:scale-[0.98] font-heading hover:bg-emerald-500 transition-transform"
            >
              Buzz
            </button>
          ) : (
            <div className="h-52 w-full max-w-sm rounded-full bg-muted flex items-center justify-center text-muted-foreground font-heading text-xl">
              {t.buzzPhase === "locked" ? "Locked" : "—"}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground font-body">Waiting…</p>
    </div>
  );
};

export default PlayGame;
