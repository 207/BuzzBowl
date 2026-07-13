import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GameCodeDisplay from "@/components/GameCodeDisplay";
import HostSetupForm from "@/components/HostSetupForm";
import LobbySettingsSummary from "@/components/LobbySettingsSummary";
import PlayerList from "@/components/PlayerList";
import { AvatarPicker } from "@/components/AvatarPicker";
import { compressSelfieFile } from "@/lib/compressSelfie";
import { mapServerPlayers } from "@/lib/gameTypes";
import { difficultyLabelFromNumbers, difficultyNumbers } from "@/lib/qbreader";
import { getSocket } from "@/lib/socket";
import {
  DEFAULT_HOST_SETUP,
  hostKey,
  hostSetupFormValues,
  playerKey,
  readHostSetup,
  socketSettingsFromHostSetup,
  type HostSetupFormValues,
  type HostSetupPayload,
  writeHostSetup,
} from "@/lib/roomStorage";
import { useServerGameState } from "@/hooks/useServerGameState";
import { useSocketResync } from "@/hooks/useSocketResync";
import { useAvatarModelPreload } from "@/hooks/useAvatarModelPreload";
import type { AvatarId } from "@/lib/avatarModels";
import type { ServerGameSettings } from "@/types/serverGame";
import { Play, ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

function setupFromGameState(
  gameMode: "ffa" | "team",
  serverSettings: ServerGameSettings,
): HostSetupFormValues {
  return {
    mode: gameMode === "team" ? "teams" : "ffa",
    playMode: serverSettings.playMode,
    questionSource: serverSettings.questionSource,
    difficulty: difficultyLabelFromNumbers(serverSettings.difficulties),
    category: serverSettings.category,
    questionCount: serverSettings.questionCount,
    correctMidRevealPoints: serverSettings.correctMidRevealPoints,
    correctFullRevealPoints: serverSettings.correctPoints,
    negPoints: serverSettings.negPoints,
    answerCountdownSeconds: serverSettings.answerCountdownSeconds,
    allowMultipleBuzzes: serverSettings.allowMultipleBuzzes,
  };
}

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

  const [setup, setSetup] = useState<HostSetupFormValues>(() => {
    const stored = readHostSetup(code);
    return stored ? hostSetupFormValues(stored) : DEFAULT_HOST_SETUP;
  });
  const isRemoteMode =
    (setup.playMode ?? gameState?.settings.playMode ?? "house") === "remote";

  const [startError, setStartError] = useState<string | null>(null);
  const [hostJoinName, setHostJoinName] = useState("");
  const [hostJoinBusy, setHostJoinBusy] = useState(false);
  const [hostSelfie, setHostSelfie] = useState<string | null>(null);
  const [hostSelfieBusy, setHostSelfieBusy] = useState(false);
  const [hostAvatarId, setHostAvatarId] = useState<AvatarId>("fox");

  useEffect(() => {
    if (!gameState || !isHost) return;
    const stored = readHostSetup(code);
    if (stored) return;
    setSetup(setupFromGameState(gameState.gameMode, gameState.settings));
  }, [gameState, isHost, code]);

  const persistAndSyncSetup = useCallback(
    (next: HostSetupFormValues) => {
      setSetup(next);
      if (!code || !hostSecret) return;

      const existing = readHostSetup(code);
      const fullSetup: HostSetupPayload = {
        ...next,
        hostName: existing?.hostName ?? "Host",
      };
      writeHostSetup(code, fullSetup);

      const s = getSocket();
      s.emit("set_game_mode", {
        roomCode: code,
        hostSecret,
        mode: next.mode === "teams" ? "team" : "ffa",
      });
      s.emit("update_settings", {
        roomCode: code,
        hostSecret,
        settings: socketSettingsFromHostSetup(fullSetup, difficultyNumbers(next.difficulty)),
      });
    },
    [code, hostSecret],
  );

  useEffect(() => {
    if (!code) return;
    setPlayerId(sessionStorage.getItem(playerKey(code)));
  }, [code]);

  const resyncSession = useCallback(() => {
    if (!code) return;
    const s = getSocket();
    if (hostSecret) {
      s.emit("host_join", { roomCode: code, hostSecret }, (res: { error?: string }) => {
        if (res?.error) toast.error("Could not reconnect as host.");
      });
      if (playerId) {
        s.emit("player_identify", { roomCode: code, playerId }, () => {});
      }
    } else if (playerId) {
      s.emit("player_identify", { roomCode: code, playerId }, (res: { error?: string }) => {
        if (res?.error) toast.error("Reconnect with name from Join.");
      });
    }
  }, [code, hostSecret, playerId]);

  useEffect(() => {
    if (!code || !hostSecret) return;
    const s = getSocket();
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
  }, [code, hostSecret]);

  useSocketResync(Boolean(code && (hostSecret || playerId)), resyncSession);

  useAvatarModelPreload();

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
    if (!code || !hostSecret) return;
    setStartError(null);
    const existing = readHostSetup(code);
    const fullSetup: HostSetupPayload = {
      ...setup,
      hostName: existing?.hostName ?? "Host",
    };
    writeHostSetup(code, fullSetup);
    const s = getSocket();
    s.emit(
      "start_game",
      {
        roomCode: code,
        hostSecret,
        settings: socketSettingsFromHostSetup(fullSetup, difficultyNumbers(setup.difficulty)),
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
        avatarId: hostAvatarId,
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

  const switchPlayerTeam = (pid: string) => {
    if (!code || !hostSecret || !gameState) return;
    const player = gameState.players.find((p) => p.id === pid);
    if (!player) return;
    const next = player.team === "A" ? "B" : player.team === "B" ? "A" : "A";
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
            {isHost ? "Adjust settings while players join" : "Waiting for the host to start"}
          </p>
        </div>

        <GameCodeDisplay code={code} />

        {isHost ? (
          <div className="game-card p-6 space-y-4">
            <p className="text-sm font-body font-medium text-foreground">Game settings</p>
            <HostSetupForm value={setup} onChange={persistAndSyncSetup} />
          </div>
        ) : gameState ? (
          <LobbySettingsSummary gameMode={gameState.gameMode} settings={gameState.settings} />
        ) : null}

        <PlayerList
          players={uiPlayers}
          mode={uiMode}
          host={
            isHost && gameState && gameState.players.length > 0
              ? {
                  onKick: kickPlayer,
                  onSwitchTeam: uiMode === "teams" ? switchPlayerTeam : undefined,
                  onRandomizeTeams: uiMode === "teams" ? randomizeTeams : undefined,
                }
              : undefined
          }
        />

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
            <AvatarPicker value={hostAvatarId} onChange={setHostAvatarId} />
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
