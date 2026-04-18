import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameCodeDisplay from "@/components/GameCodeDisplay";
import PlayerList from "@/components/PlayerList";
import { compressSelfieFile } from "@/lib/compressSelfie";
import { mapServerPlayers } from "@/lib/gameTypes";
import { difficultyNumbers } from "@/lib/qbreader";
import { getSocket } from "@/lib/socket";
import {
  hostKey,
  playerKey,
  readHostSetup,
  socketSettingsFromHostSetup,
} from "@/lib/roomStorage";
import { useServerGameState } from "@/hooks/useServerGameState";
import { Play, ArrowLeft, Shuffle, X, Camera } from "lucide-react";
import { toast } from "sonner";

const Lobby = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const code = (paramCode ?? "").toUpperCase();
  const gameState = useServerGameState(code);

  const hostSecret = useMemo(() => (code ? sessionStorage.getItem(hostKey(code)) : null), [code]);
  const [playerId, setPlayerId] = useState<string | null>(() =>
    code ? sessionStorage.getItem(playerKey(code)) : null,
  );
  const isHost = Boolean(hostSecret);
  const setup = useMemo(() => readHostSetup(code), [code]);
  const isRemoteMode = (setup?.playMode ?? gameState?.settings.playMode ?? "house") === "remote";

  const [startError, setStartError] = useState<string | null>(null);
  const [hostJoinName, setHostJoinName] = useState("");
  const [hostJoinBusy, setHostJoinBusy] = useState(false);
  const [hostSelfie, setHostSelfie] = useState<string | null>(null);
  const [hostSelfieBusy, setHostSelfieBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    setPlayerId(sessionStorage.getItem(playerKey(code)));
  }, [code]);

  useEffect(() => {
    if (!code) return;
    const s = getSocket();
    if (hostSecret) {
      s.emit("host_join", { roomCode: code, hostSecret }, (res: { error?: string }) => {
        if (res?.error) toast.error("Could not reconnect as host.");
      });
      if (playerId) {
        s.emit("player_identify", { roomCode: code, playerId }, () => {});
      }
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
          settings: socketSettingsFromHostSetup(st, difficultyNumbers(st.difficulty)),
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
      if (isHost) {
        if (gameState.settings.playMode === "remote") navigate(`/play/${code}`);
        else navigate(`/host/game/${code}`);
      }
      else navigate(`/play/${code}`);
    }
  }, [gameState, code, isHost, navigate]);

  useEffect(() => {
    if (!gameState || isHost || !playerId) return;
    const stillPresent = gameState.players.some((p) => p.id === playerId);
    if (!stillPresent) {
      sessionStorage.removeItem(playerKey(code));
      toast.error("Host removed you from this lobby.");
      navigate(`/join/${code}`);
    }
  }, [gameState, isHost, playerId, code, navigate]);

  const uiMode = gameState?.gameMode === "team" ? "teams" : "ffa";
  const uiPlayers = gameState
    ? mapServerPlayers(gameState.players, gameState.gameMode)
    : [];
  const needsRemoteHostPlayer = isHost && isRemoteMode && !playerId;

  const handleStart = () => {
    if (!code || !hostSecret || !setup) return;
    setStartError(null);
    const s = getSocket();
    s.emit(
      "start_game",
      {
        roomCode: code,
        hostSecret,
        settings: socketSettingsFromHostSetup(setup, difficultyNumbers(setup.difficulty)),
      },
      (res: { error?: string; message?: string }) => {
        if (res?.error === "no_tossups")
          setStartError("No questions for those filters — widen category or difficulty.");
        else if (res?.error === "fetch_failed")
          setStartError(res.message ?? "Could not load questions.");
        else if (res?.error) setStartError("Could not start.");
      },
    );
  };

  const onPickHostSelfie = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setHostSelfieBusy(true);
    try {
      const dataUrl = await compressSelfieFile(file);
      if (!dataUrl) toast.error("Could not use that photo. Try another image.");
      else setHostSelfie(dataUrl);
    } finally {
      setHostSelfieBusy(false);
    }
  };

  const handleHostJoinAsPlayer = () => {
    if (!code) return;
    if (!hostJoinName.trim()) {
      toast.error("Enter your player name first.");
      return;
    }
    setHostJoinBusy(true);
    getSocket().emit(
      "player_join",
      {
        roomCode: code,
        nickname: hostJoinName.trim(),
        ...(hostSelfie ? { avatarDataUrl: hostSelfie } : {}),
      },
      (res: { error?: string; playerId?: string }) => {
        setHostJoinBusy(false);
        if (res.error) {
          if (res.error === "room_not_found") toast.error("Room not found.");
          else if (res.error === "game_already_started") toast.error("Game already started.");
          else toast.error("Could not join as player.");
          return;
        }
        if (res.playerId) {
          sessionStorage.setItem(playerKey(code), res.playerId);
          setPlayerId(res.playerId);
          toast.success("Joined as player.");
        }
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

  const kickPlayer = (pid: string) => {
    if (!code || !hostSecret) return;
    getSocket().emit("kick_player", {
      roomCode: code,
      hostSecret,
      playerId: pid,
    });
  };

  const randomizeTeams = () => {
    if (!code || !hostSecret) return;
    getSocket().emit("randomize_teams", {
      roomCode: code,
      hostSecret,
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

        {needsRemoteHostPlayer && (
          <div className="game-card p-4 space-y-3">
            <p className="text-sm font-body text-muted-foreground">
              Remote mode requires the host to join as a player before starting.
            </p>
            <input
              type="text"
              value={hostJoinName}
              onChange={(e) => setHostJoinName(e.target.value)}
              placeholder="Your player name"
              maxLength={24}
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-body">
                <Camera className="h-4 w-4" />
                {hostSelfieBusy ? "Processing…" : hostSelfie ? "Change selfie" : "Add selfie"}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={onPickHostSelfie}
                  disabled={hostSelfieBusy}
                />
              </label>
              {hostSelfie ? (
                <img src={hostSelfie} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-border" />
              ) : null}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleHostJoinAsPlayer}
              disabled={hostJoinBusy || hostSelfieBusy || !hostJoinName.trim()}
            >
              Join this room as player
            </Button>
          </div>
        )}

        {isHost && gameState?.players.length > 0 && (
          <div className="game-card p-4 space-y-3">
            <p className="text-sm font-body text-muted-foreground">
              Host controls: click a player to assign team (team mode), hover row to kick.
            </p>
            {gameState.gameMode === "team" && (
              <Button variant="outline" size="sm" className="w-full" onClick={randomizeTeams}>
                <Shuffle className="w-4 h-4" />
                Randomize teams
              </Button>
            )}
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center gap-2 rounded-lg bg-muted/70 border border-border/50 px-3 py-2"
                >
                  {gameState.gameMode === "team" ? (
                    <button
                      type="button"
                      onClick={() => cycleTeam(p.id, p.team)}
                      className="flex-1 text-left text-sm font-body hover:text-foreground transition-colors"
                    >
                      {p.nickname}:{" "}
                      {p.team === null ? "—" : p.team === "A" ? gameState.teamNames.A : gameState.teamNames.B}
                    </button>
                  ) : (
                    <span className="flex-1 text-left text-sm font-body">{p.nickname}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => kickPlayer(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Kick ${p.nickname}`}
                    title={`Kick ${p.nickname}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
              disabled={!gameState || gameState.players.length < 1 || needsRemoteHostPlayer}
            >
              <Play className="w-5 h-5" />
              Start Game ({gameState?.players.length ?? 0} player
              {(gameState?.players.length ?? 0) !== 1 ? "s" : ""})
            </Button>
            {needsRemoteHostPlayer ? (
              <p className="text-xs text-center text-muted-foreground font-body">
                Join as player to start remote mode.
              </p>
            ) : null}
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
