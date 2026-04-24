import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useServerGameState } from "@/hooks/useServerGameState";
import { mapServerPlayers } from "@/lib/gameTypes";
import { GameOverScreen } from "@/components/GameOverScreen";
import { emitReaderControl, getSocket, type ReaderControlEvent } from "@/lib/socket";
import { hostKey, playerKey } from "@/lib/roomStorage";
import { AnswerCountdown } from "@/components/AnswerCountdown";
import { NextRoundCountdown } from "@/components/NextRoundCountdown";
import { BreakTopThree } from "@/components/BreakTopThree";
import { quizbowlCategoryEmoji } from "@/lib/categoryEmoji";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { AVATARS } from "@/lib/gameTypes";
import { Pause, Play, SkipForward, Check, X, FastForward, Maximize2 } from "lucide-react";

const PlayGame = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const [playerId, setPlayerId] = useState<string | null>(() =>
    code ? sessionStorage.getItem(playerKey(code)) : null,
  );
  const hostSecret = useMemo(
    () => (code ? sessionStorage.getItem(hostKey(code)) : null),
    [code],
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
    if (hostSecret) {
      return (
        <GameOverScreen
          variant="host"
          celebrate={state.settings.playMode === "remote"}
          gameMode={state.gameMode}
          teamNames={state.teamNames}
          teamScoreA={state.teamScoreA}
          teamScoreB={state.teamScoreB}
          uiPlayers={uiPlayers}
          onRestart={() => getSocket().emit("restart_game", { roomCode: code, hostSecret })}
          onHome={() => navigate("/")}
        />
      );
    }
    return (
      <GameOverScreen
        variant="player"
        celebrate={state.settings.playMode === "remote"}
        gameMode={state.gameMode}
        teamNames={state.teamNames}
        teamScoreA={state.teamScoreA}
        teamScoreB={state.teamScoreB}
        uiPlayers={uiPlayers}
        onHome={() => navigate("/")}
      />
    );
  }

  if (state.phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <NextRoundCountdown countdownDeadlineMs={state.countdownDeadlineMs ?? null} />
      </div>
    );
  }

  if (state.phase === "between") {
    const canAdvance = state.betweenControlsPlayerId === playerId;
    const isLastBreak = state.currentTossupIndex + 1 >= state.totalTossups;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-heading text-foreground">Round break</p>
        {state.answer ? (
          <div className="game-card w-full max-w-md p-5">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Previous answer</p>
            <p className="mt-2 text-base font-heading text-accent">{state.answer}</p>
          </div>
        ) : null}
        <BreakTopThree players={state.players} gameMode={state.gameMode} />
        {state.gameMode === "ffa" && (
          <p className="text-sm text-muted-foreground font-body">
            Your score: <span className="font-mono font-semibold text-primary">{me?.score ?? 0}</span>
          </p>
        )}
        {state.gameMode === "team" && (
          <p className="text-muted-foreground font-body text-sm">
            {state.teamNames.A} {state.teamScoreA} — {state.teamScoreB} {state.teamNames.B}
          </p>
        )}
        {canAdvance ? (
          <Button variant="hero" size="xl" className="w-full max-w-sm" onClick={() => emitAsReader("continue_game")}>
            <FastForward className="w-5 h-5" />
            {isLastBreak ? "See Results" : "Next question"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            Waiting for the judge to start the next question…
          </p>
        )}
      </div>
    );
  }

  if (state.phase === "playing" && state.tossup) {
    const t = state.tossup;
    const imJudge = state.readerPlayerId === playerId;
    const isRemoteMode = state.settings.playMode === "remote";
    const isHouseMode = state.settings.playMode === "house";
    const showQuestionCard = !isHouseMode || imJudge;
    const eligible = state.eligibleBuzzIds?.includes(playerId) ?? false;
    const canBuzz = t.buzzPhase === "open" && eligible;
    const iBuzzed = t.buzzPhase === "locked" && t.buzzWinnerId === playerId;
    const watching = state.gameMode === "team" && !eligible && !iBuzzed && !imJudge;
    const buzzedPlayer = t.buzzWinnerId
      ? state.players.find((p) => p.id === t.buzzWinnerId) ?? null
      : null;
    const buzzedPlayerEmoji =
      buzzedPlayer != null
        ? AVATARS[Math.max(0, state.players.findIndex((p) => p.id === buzzedPlayer.id)) % AVATARS.length]
        : "👤";

    const skipVotes = state.ffaSkipVotes ?? [];
    const skipNeeded = state.ffaSkipVotesNeeded ?? 0;
    const hasSkipVote = playerId ? skipVotes.includes(playerId) : false;

    const revealToggleDisabled = t.revealComplete;
    const revealToggleLabel = t.revealComplete ? "Reveal done" : t.revealPaused ? "Resume" : "Pause";
    const categoryBadge =
      state.settings.questionSource === "qbreader"
        ? `${quizbowlCategoryEmoji(t.category)} ${t.category ?? "Unknown"}`
        : null;

    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="border-b border-border px-4 py-3 text-center text-sm text-muted-foreground font-body">
          {state.gameMode === "team" ? (
            <span>
              {state.teamNames.A} {state.teamScoreA} — {state.teamScoreB} {state.teamNames.B}
            </span>
          ) : (
            <span className="text-primary font-semibold">Your score: {me?.score ?? 0}</span>
          )}
        </div>
        {imJudge && (
          <p className="bg-primary/15 px-4 py-2 text-center text-sm font-body text-primary font-medium">
            You&apos;re the judge — run controls below (buzzer off)
          </p>
        )}
        {watching && (
          <p className="bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
            Watching this matchup — buzzer off
          </p>
        )}
        {t.buzzPhase === "locked" && buzzedPlayer && (
          <div className="mx-4 mt-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
            <p className="text-center text-[11px] font-body uppercase tracking-wider text-muted-foreground">
              Buzzed by
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <PlayerAvatar
                size="row"
                player={{
                  avatar: buzzedPlayerEmoji,
                  selfieDataUrl: buzzedPlayer.avatarDataUrl ?? null,
                }}
              />
              <span className="text-xl font-heading font-bold text-foreground">
                {buzzedPlayer.nickname}
              </span>
            </div>
          </div>
        )}
        {imJudge && t.buzzPhase === "locked" && (
          <div className="mx-4 mt-3 flex flex-wrap gap-2 justify-center">
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
          </div>
        )}

        <div className="flex flex-shrink-0 flex-col gap-2 px-4 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-body">
            <span>
              Question {state.currentTossupIndex + 1} / {state.totalTossups}
            </span>
            {categoryBadge ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-foreground">
                {categoryBadge}
              </span>
            ) : null}
            {state.gameMode === "team" && (
              <span>
                {state.players.find((p) => p.id === state.activePlayerIdA)?.nickname ?? "—"} vs{" "}
                {state.players.find((p) => p.id === state.activePlayerIdB)?.nickname ?? "—"}
              </span>
            )}
          </div>
          {showQuestionCard ? (
            <div className="game-card max-h-[min(42vh,20rem)] overflow-y-auto p-4 sm:min-h-[10rem] sm:p-6 md:max-h-none md:min-h-[12rem]">
              <p className="text-base font-body leading-relaxed text-foreground sm:text-lg md:text-xl">
                {t.revealedText}
                {!t.revealComplete ? <span className="text-muted-foreground"> ▌</span> : null}
              </p>
              {t.revealPaused ? (
                <p className="mt-3 text-sm text-primary font-body">Paused</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground font-body">
              Question is shown on the host screen in house party mode.
            </div>
          )}
        </div>

        {imJudge && state.answer ? (
          <div className="mx-4 mt-4 game-card border-primary/30 p-5">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Answer line</p>
            <p className="mt-2 text-lg font-heading text-accent leading-snug">{state.answer}</p>
          </div>
        ) : null}

        {state.gameMode === "ffa" && (
          <div className="mx-4 mt-3 flex flex-col items-center gap-2">
            <p className="text-center text-xs text-muted-foreground font-body">
              Vote to skip: {skipVotes.length} / {skipNeeded || "—"}
              {skipNeeded > 0 && skipVotes.length >= skipNeeded ? " — skipping…" : ""}
            </p>
            {!imJudge && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="max-w-xs"
                disabled={!playerId || hasSkipVote || skipNeeded === 0}
                onClick={() => {
                  if (!code || !playerId) return;
                  getSocket().emit("vote_ffa_skip", { roomCode: code, playerId });
                }}
              >
                {hasSkipVote ? "Skip vote recorded" : "Vote to skip question"}
              </Button>
            )}
          </div>
        )}

        {imJudge && (
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
              <Button variant="glow" size="lg" onClick={() => emitAsReader("skip_question")}>
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            </div>
            {t.buzzPhase === "locked" && (t.answerDeadlineMs ?? null) != null && (
              <AnswerCountdown
                answerDeadlineMs={t.answerDeadlineMs}
                maxSeconds={state.settings.answerCountdownSeconds}
                className="flex flex-col items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 py-4"
              />
            )}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 pt-4">
          {t.buzzPhase === "locked" &&
            !imJudge &&
            !iBuzzed &&
            (t.answerDeadlineMs ?? null) != null && (
              <AnswerCountdown
                compact
                answerDeadlineMs={t.answerDeadlineMs}
                maxSeconds={state.settings.answerCountdownSeconds}
                className="w-full max-w-sm flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 py-3"
              />
            )}
          {iBuzzed ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-3xl font-heading font-bold text-primary">You buzzed!</p>
              {(t.answerDeadlineMs ?? null) != null && (
                <AnswerCountdown
                  compact
                  answerDeadlineMs={t.answerDeadlineMs}
                  maxSeconds={state.settings.answerCountdownSeconds}
                  className="w-full max-w-sm flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 py-3"
                />
              )}
            </div>
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
