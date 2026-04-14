import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useServerGameState } from "@/hooks/useServerGameState";
import { mapServerPlayers } from "@/lib/gameTypes";
import { GameOverScreen } from "@/components/GameOverScreen";
import { emitReaderControl, getSocket, type ReaderControlEvent } from "@/lib/socket";
import { playerKey } from "@/lib/roomStorage";
import { Pause, Play, SkipForward, Check, X, FastForward, Maximize2 } from "lucide-react";

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

  const emitAsReader = (event: ReaderControlEvent) => {
    if (!code || !playerId) return;
    emitReaderControl(event, { roomCode: code, playerId });
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
    return (
      <GameOverScreen
        variant="player"
        gameMode={state.gameMode}
        teamNames={state.teamNames}
        teamScoreA={state.teamScoreA}
        teamScoreB={state.teamScoreB}
        uiPlayers={uiPlayers}
        onHome={() => navigate("/")}
      />
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
          <Button variant="hero" size="xl" className="w-full max-w-sm" onClick={() => emitAsReader("continue_game")}>
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
                  if (t.revealPaused) emitAsReader("resume_reveal");
                  else emitAsReader("pause_reveal");
                }}
              >
                {t.revealPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {revealToggleLabel}
              </Button>
              <Button variant="outline" size="lg" onClick={() => emitAsReader("show_full_question")}>
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
                  onClick={() => emitAsReader("mark_correct")}
                >
                  <Check className="w-5 h-5" />
                  Correct
                </Button>
                <Button variant="destructive" size="lg" onClick={() => emitAsReader("mark_incorrect")}>
                  <X className="w-5 h-5" />
                  Incorrect
                </Button>
                <Button variant="glow" size="lg" onClick={() => emitAsReader("skip_question")}>
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
