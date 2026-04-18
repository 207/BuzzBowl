import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServerGameState } from "@/hooks/useServerGameState";
import { getSocket } from "@/lib/socket";
import { hostKey, playerKey } from "@/lib/roomStorage";
import { toast } from "sonner";
import { AnswerCountdown } from "@/components/AnswerCountdown";
import { NextRoundCountdown } from "@/components/NextRoundCountdown";
import { GameOverScreen } from "@/components/GameOverScreen";
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
    if (state?.settings.playMode === "remote") {
      const pid = sessionStorage.getItem(playerKey(code));
      if (pid) navigate(`/play/${code}`);
      else navigate(`/join/${code}`);
    }
  }, [state?.phase, state?.settings.playMode, code, navigate]);

  const emitHost = (event: string) => {
    if (!code || !hostSecret) return;
    getSocket().emit(event, { roomCode: code, hostSecret });
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
    return (
      <GameOverScreen
        variant="host"
        gameMode={state.gameMode}
        teamNames={state.teamNames}
        teamScoreA={state.teamScoreA}
        teamScoreB={state.teamScoreB}
        uiPlayers={uiPlayers}
        onRestart={() => emitHost("restart_game")}
        onHome={() => navigate("/")}
      />
    );
  }

  if (state.phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8">
        <h2 className="text-2xl font-heading font-bold text-foreground">Get ready</h2>
        <NextRoundCountdown countdownDeadlineMs={state.countdownDeadlineMs ?? null} />
        <p className="max-w-md text-center text-sm text-muted-foreground font-body">
          Judge:{" "}
          <span className="text-foreground font-medium">
            {state.readerPlayerId
              ? state.players.find((p) => p.id === state.readerPlayerId)?.nickname ?? "—"
              : "—"}
          </span>
        </p>
        <PlayerList players={uiPlayers} mode={uiMode} />
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
        <p className="max-w-md text-center text-sm text-muted-foreground font-body">
          <span className="text-foreground font-medium">Judge</span> advances the game from their phone (next question).
        </p>
      </div>
    );
  }

  if (state.phase === "playing" && state.tossup) {
    const t = state.tossup;
    return (
      <div className="min-h-screen flex flex-col px-4 py-8 max-w-4xl mx-auto w-full gap-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground font-body">
          <span>
            Question {state.currentTossupIndex + 1} / {state.totalTossups}
          </span>
          <span>
            Judge:{" "}
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
              Printed answer is on the <span className="text-foreground font-semibold">judge&apos;s phone</span> until
              this question ends (shown here on the break screen).
            </p>
            <p className="mt-3 text-sm text-muted-foreground font-body">
              Buzzed: <span className="text-foreground font-semibold">{t.buzzWinnerName}</span>
            </p>
            {(t.answerDeadlineMs ?? null) != null && (
              <AnswerCountdown answerDeadlineMs={t.answerDeadlineMs} />
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground font-body max-w-xl mx-auto">
          Pause, reveal, scoring, and skip are on the <span className="text-foreground font-medium">judge&apos;s phone</span>{" "}
          so this screen can stay up without someone at the laptop.
        </p>

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
