import { Player, GameMode } from "@/lib/gameTypes";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Shuffle, X } from "lucide-react";

export interface PlayerListHostControls {
  onKick: (playerId: string) => void;
  onSwitchTeam?: (playerId: string) => void;
  onRandomizeTeams?: () => void;
}

interface PlayerListProps {
  players: Player[];
  mode: GameMode;
  /** Larger layout for house-party TV display */
  scale?: "normal" | "tv";
  host?: PlayerListHostControls;
}

const PlayerList = ({ players, mode, scale = "normal", host }: PlayerListProps) => {
  const tv = scale === "tv";
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);

  if (mode === "teams") {
    return (
      <div className="space-y-3">
        {host?.onRandomizeTeams ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={host.onRandomizeTeams}>
              <Shuffle className="w-4 h-4" />
              Randomize teams
            </Button>
          </div>
        ) : null}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${tv ? "gap-8" : "gap-4"}`}>
          <TeamColumn title="Team 1" players={team1} color="primary" tv={tv} host={host} />
          <TeamColumn title="Team 2" players={team2} color="accent" tv={tv} host={host} />
        </div>
      </div>
    );
  }

  return (
    <div className={`game-card ${tv ? "p-8" : "p-5"}`}>
      <h3
        className={`font-heading font-bold mb-3 text-foreground ${
          tv ? "text-3xl mb-5" : "text-lg mb-3"
        }`}
      >
        Players ({players.length})
      </h3>
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${tv ? "gap-4 sm:grid-cols-4" : "gap-2"}`}>
        {players.map((p) => (
          <PlayerChip key={p.id} player={p} tv={tv} host={host} />
        ))}
      </div>
    </div>
  );
};

const TeamColumn = ({
  title,
  players,
  color,
  tv,
  host,
}: {
  title: string;
  players: Player[];
  color: string;
  tv: boolean;
  host?: PlayerListHostControls;
}) => (
  <div className={`game-card ${tv ? "p-8" : "p-5"}`}>
    <h3
      className={`font-heading font-bold mb-3 ${
        tv ? "text-3xl mb-5" : "text-lg mb-3"
      } ${color === "primary" ? "text-primary" : "text-accent"}`}
    >
      {title}
    </h3>
    <div className={tv ? "space-y-3" : "space-y-2"}>
      {players.map((p) => (
        <PlayerChip key={p.id} player={p} tv={tv} host={host} />
      ))}
      {players.length === 0 && (
        <p className={`text-muted-foreground italic ${tv ? "text-lg" : "text-sm"}`}>
          Waiting for players...
        </p>
      )}
    </div>
  </div>
);

const PlayerChip = ({
  player,
  tv,
  host,
}: {
  player: Player;
  tv: boolean;
  host?: PlayerListHostControls;
}) => (
  <div
    className={`group flex items-center gap-2 bg-muted/50 rounded-lg ${
      tv ? "px-5 py-3 gap-3" : "px-3 py-2"
    }`}
  >
    <PlayerAvatar player={player} size={tv ? "row" : "lobby"} />
    <span
      className={`min-w-0 flex-1 font-body font-medium text-foreground truncate ${
        tv ? "text-lg" : "text-sm"
      }`}
    >
      {player.name}
    </span>
    {player.score > 0 && !host ? (
      <span className={`font-bold text-primary ${tv ? "text-base" : "text-xs"}`}>
        {player.score}
      </span>
    ) : null}
    {host ? (
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {host.onSwitchTeam ? (
          <button
            type="button"
            onClick={() => host.onSwitchTeam!(player.id)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Switch ${player.name} to other team`}
            title="Switch team"
          >
            <ArrowLeftRight className={tv ? "h-5 w-5" : "h-4 w-4"} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => host.onKick(player.id)}
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Kick ${player.name}`}
          title={`Kick ${player.name}`}
        >
          <X className={tv ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      </div>
    ) : null}
  </div>
);

export default PlayerList;
