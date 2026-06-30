import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useServerGameState } from "@/hooks/useServerGameState";
import { useSocketResync } from "@/hooks/useSocketResync";
import { getSocket } from "@/lib/socket";
import { hostKey, playerKey } from "@/lib/roomStorage";
import { toast } from "sonner";
import { AnswerCountdown } from "@/components/AnswerCountdown";
import { NextRoundCountdown } from "@/components/NextRoundCountdown";
import { GameOverScreen } from "@/components/GameOverScreen";
import PlayerList from "@/components/PlayerList";
import { BreakTopThree } from "@/components/BreakTopThree";
import { mapServerPlayers } from "@/lib/gameTypes";
import { quizbowlCategoryEmoji } from "@/lib/categoryEmoji";
import { JudgeVerdictFlash } from "@/components/JudgeVerdictFlash";
import { useAvatarModelPreload } from "@/hooks/useAvatarModelPreload";
import { judgeVerdictOverlayProps } from "@/lib/judgeVerdictOverlay";

const HostLive = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const hostSecret = useMemo(() => (code ? sessionStorage.getItem(hostKey(code)) : null), [code]);
  const state = useServerGameState(code);
  const questionScrollRef = useRef<HTMLDivElement>(null);

  const resyncHost = useCallback(() => {
    if (!code || !hostSecret) return;
    getSocket().emit("host_join", { roomCode: code, hostSecret }, (res: { error?: string }) => {
      if (res?.error) toast.error("Could not reconnect as host.");
    });
  }, [code, hostSecret]);

  useEffect(() => {
    if (!code || !hostSecret) {
      toast.error("Missing host key — open the lobby from this device.");
      navigate("/");
    }
  }, [code, hostSecret, navigate]);

  useSocketResync(Boolean(code && hostSecret), resyncHost);

  useAvatarModelPreload();

  useEffect(() => {
    if (questionScrollRef.current && state?.tossup?.revealedText) {
      questionScrollRef.current.scrollTop = questionScrollRef.current.scrollHeight;
    }
  }, [state?.tossup?.revealedText]);

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

  const isHouse = state.settings.playMode === "house";
  const tv = isHouse ? "tv" as const : "normal" as const;
  const uiMode = state.gameMode === "team" ? "teams" : "ffa";
  const uiPlayers = mapServerPlayers(state.players, state.gameMode);
  const verdictOverlayProps = judgeVerdictOverlayProps(state);
  const judgeVerdictOverlay = verdictOverlayProps ? (
    <JudgeVerdictFlash {...verdictOverlayProps} />
  ) : null;

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
      <div
        className={`min-h-screen flex flex-col items-center justify-center gap-8 ${
          isHouse ? "px-8 py-16 gap-12" : "px-4 py-12"
        }`}
      >
        <h2
          className={`font-heading font-bold text-foreground ${
            isHouse ? "text-5xl" : "text-2xl"
          }`}
        >
          Get ready
        </h2>
        <NextRoundCountdown countdownDeadlineMs={state.countdownDeadlineMs ?? null} scale={tv} />
        <p
          className={`max-w-md text-center text-muted-foreground font-body ${
            isHouse ? "max-w-2xl text-xl" : "text-sm"
          }`}
        >
          Judge:{" "}
          <span className="text-foreground font-medium">
            {state.readerPlayerId
              ? state.players.find((p) => p.id === state.readerPlayerId)?.nickname ?? "—"
              : "—"}
          </span>
        </p>
        <PlayerList players={uiPlayers} mode={uiMode} scale={tv} />
      </div>
    );
  }

  if (state.phase === "between") {
    return (
      <div
        className={`relative min-h-screen flex flex-col items-center justify-center gap-8 ${
          isHouse ? "px-8 py-16 gap-12" : "px-4 py-12"
        }`}
      >
        <h2
          className={`font-heading font-bold text-foreground ${
            isHouse ? "text-5xl" : "text-2xl"
          }`}
        >
          Break
        </h2>
        {state.answer ? (
          <div
            className={`game-card w-full text-center ${
              isHouse ? "max-w-4xl p-10" : "max-w-2xl p-6"
            }`}
          >
            <p
              className={`font-body text-muted-foreground uppercase tracking-wider ${
                isHouse ? "text-base" : "text-xs"
              }`}
            >
              Previous answer
            </p>
            <p
              className={`mt-2 font-heading text-accent ${
                isHouse ? "text-3xl" : "text-lg"
              }`}
            >
              {state.answer}
            </p>
          </div>
        ) : null}
        <BreakTopThree players={state.players} gameMode={state.gameMode} scale={tv} />
        <PlayerList players={uiPlayers} mode={uiMode} scale={tv} />
        <p
          className={`max-w-md text-center text-muted-foreground font-body ${
            isHouse ? "max-w-3xl text-xl" : "text-sm"
          }`}
        >
          <span className="text-foreground font-medium">Judge</span> advances the game from their phone (next question).
        </p>
        {judgeVerdictOverlay}
      </div>
    );
  }

  if (state.phase === "playing" && state.tossup) {
    const t = state.tossup;
    const categoryBadge =
      state.settings.questionSource === "qbreader"
        ? `${quizbowlCategoryEmoji(t.category)} ${t.category ?? "Unknown"}`
        : null;
    return (
      <div
        className={`relative min-h-screen flex flex-col mx-auto w-full gap-6 ${
          isHouse ? "px-8 py-10 max-w-6xl gap-8" : "px-4 py-8 max-w-4xl"
        }`}
      >
        <div
          className={`flex flex-wrap justify-between gap-2 text-muted-foreground font-body ${
            isHouse ? "text-xl gap-4" : "text-sm"
          }`}
        >
          <span>
            Question {state.currentTossupIndex + 1} / {state.totalTossups}
          </span>
          {categoryBadge ? (
            <span
              className={`rounded-full border border-border text-foreground ${
                isHouse ? "px-4 py-1 text-lg" : "px-2 py-0.5"
              }`}
            >
              {categoryBadge}
            </span>
          ) : null}
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

        <div 
          ref={questionScrollRef}
          className={`game-card overflow-y-auto ${isHouse ? "p-12 h-[24rem]" : "p-8 h-[16rem]"}`}
        >
          <p
            className={`font-body leading-relaxed text-foreground ${
              isHouse ? "text-4xl md:text-5xl" : "text-xl md:text-2xl"
            }`}
          >
            {t.revealedText}
            {!t.revealComplete ? <span className="text-muted-foreground"> ▌</span> : null}
          </p>
          {t.revealPaused ? (
            <p className={`mt-4 text-primary font-body ${isHouse ? "text-xl" : "text-sm"}`}>
              Paused
            </p>
          ) : null}
        </div>

        {t.buzzPhase === "locked" && (
          <div className={`game-card border-border/60 ${isHouse ? "p-8" : "p-5"}`}>
            <p
              className={`text-muted-foreground font-body ${
                isHouse ? "text-lg" : "text-sm"
              }`}
            >
              Printed answer is on the <span className="text-foreground font-semibold">judge&apos;s phone</span> until
              this question ends (shown here on the break screen).
            </p>
            <p
              className={`mt-3 text-muted-foreground font-body ${
                isHouse ? "text-xl mt-4" : "text-sm mt-3"
              }`}
            >
              Buzzed: <span className="text-foreground font-semibold">{t.buzzWinnerName}</span>
            </p>
            {(t.answerDeadlineMs ?? null) != null && (
              <AnswerCountdown
                answerDeadlineMs={t.answerDeadlineMs}
                maxSeconds={state.settings.answerCountdownSeconds}
                large={isHouse}
              />
            )}
          </div>
        )}

        <p
          className={`text-center text-muted-foreground font-body mx-auto ${
            isHouse ? "text-xl max-w-3xl" : "text-sm max-w-xl"
          }`}
        >
          Pause, reveal, scoring, and skip are on the <span className="text-foreground font-medium">judge&apos;s phone</span>{" "}
          so this screen can stay up without someone at the laptop.
        </p>

        <PlayerList players={uiPlayers} mode={uiMode} scale={tv} />
        {judgeVerdictOverlay}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className={`text-muted-foreground font-body ${isHouse ? "text-xl" : ""}`}>Waiting…</p>
    </div>
  );
};

export default HostLive;
