import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameCodeDisplay from "@/components/GameCodeDisplay";
import PlayerList from "@/components/PlayerList";
import { mapServerPlayers } from "@/lib/gameTypes";
import { difficultyNumbers } from "@/lib/qbreader";
import { getSocket } from "@/lib/socket";
import { hostKey, playerKey, readHostSetup } from "@/lib/roomStorage";
import { useServerGameState } from "@/hooks/useServerGameState";
import { Play, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Lobby = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const gameState = useServerGameState(code);

  const hostSecret = useMemo(() => (code ? sessionStorage.getItem(hostKey(code)) : null), [code]);
  const playerId = useMemo(() => (code ? sessionStorage.getItem(playerKey(code)) : null), [code]);
  const isHost = Boolean(hostSecret);
  const setup = useMemo(() => readHostSetup(code), [code]);

  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const s = getSocket();
    if (hostSecret) {
      s.emit("host_join", { roomCode: code, hostSecret }, (res: { error?: string }) => {
        if (res?.error) toast.error("Could not reconnect as host.");
      });
      const st = readHostSetup(code);
      if (st) {
        s.emit("set_game_mode", {
          roomCode: code,
          hostSecret,
          mode: st.mode === "teams" ? "team" : "ffa",
        });
        s.emit("update_settings", {
          roomCode: code,
          hostSecret,
          settings: {
            questionCount: st.questionCount,
            category: st.category.trim(),
            difficulties: difficultyNumbers(st.difficulty),
            correctPoints: 10,
            negPoints: 5,
          },
        });
      }
    } else if (playerId) {
      s.emit("player_identify", { roomCode: code, playerId }, (res: { error?: string }) => {
        if (res?.error) toast.error("Reconnect with name from Join.");
      });
    }
  }, [code, hostSecret, playerId]);

  useEffect(() => {
    if (!gameState || !code) return;
    if (gameState.phase !== "lobby") {
      if (isHost) navigate(`/host/game/${code}`);
      else navigate(`/play/${code}`);
    }
  }, [gameState, code, isHost, navigate]);

  const uiMode = gameState?.gameMode === "team" ? "teams" : "ffa";
  const uiPlayers = gameState
    ? mapServerPlayers(gameState.players, gameState.gameMode)
    : [];

  const handleStart = () => {
    if (!code || !hostSecret || !setup) return;
    setStartError(null);
    const s = getSocket();
    s.emit(
      "start_game",
      {
        roomCode: code,
        hostSecret,
        settings: {
          questionCount: setup.questionCount,
          category: setup.category.trim(),
          difficulties: difficultyNumbers(setup.difficulty),
          correctPoints: 10,
          negPoints: 5,
        },
      },
      (res: { error?: string; message?: string }) => {
        if (res?.error === "no_tossups")
          setStartError("No tossups for those filters — widen category or difficulty.");
        else if (res?.error === "fetch_failed")
          setStartError(res.message ?? "Could not reach QB Reader.");
        else if (res?.error) setStartError("Could not start.");
      },
    );
  };

  const cycleTeam = (pid: string, team: "A" | "B" | null) => {
    if (!code || !hostSecret) return;
    const next = team === null ? "A" : team === "A" ? "B" : null;
    getSocket().emit("set_player_team", {
      roomCode: code,
      hostSecret,
      playerId: pid,
      team: next,
    });
  };

  if (!code) {
    return <p className="p-6 text-foreground">Invalid room.</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">Game Lobby</h1>
          <p className="text-muted-foreground font-body text-sm">
            {uiMode === "teams" ? "Teams Mode" : "Free For All"}
            {setup ? ` · ${setup.difficulty}` : ""}
          </p>
        </div>

        <GameCodeDisplay code={code} />

        <PlayerList players={uiPlayers} mode={uiMode} />

        {isHost && gameState?.gameMode === "team" && gameState.players.length > 0 && (
          <div className="game-card p-4 space-y-2">
            <p className="text-sm font-body text-muted-foreground">Assign teams (tap name)</p>
            <div className="flex flex-wrap gap-2">
              {gameState.players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => cycleTeam(p.id, p.team)}
                  className="rounded-lg bg-muted px-3 py-2 text-sm font-body hover:bg-muted/80"
                >
                  {p.nickname}:{" "}
                  {p.team === null ? "—" : p.team === "A" ? gameState.teamNames.A : gameState.teamNames.B}
                </button>
              ))}
            </div>
          </div>
        )}

        {isHost && (
          <>
            {startError ? <p className="text-sm text-destructive text-center font-body">{startError}</p> : null}
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleStart}
              disabled={!gameState || gameState.players.length < 1}
            >
              <Play className="w-5 h-5" />
              Start Game ({gameState?.players.length ?? 0} player
              {(gameState?.players.length ?? 0) !== 1 ? "s" : ""})
            </Button>
          </>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-body animate-pulse">
              Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
