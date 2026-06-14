import { Player, GameMode } from "@/lib/gameTypes";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface PlayerListProps {
  players: Player[];
  mode: GameMode;
  /** Larger layout for house-party TV display */
  scale?: "normal" | "tv";
}

const PlayerList = ({ players, mode, scale = "normal" }: PlayerListProps) => {
  const tv = scale === "tv";
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);

  if (mode === "teams") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${tv ? "gap-8" : "gap-4"}`}>
        <TeamColumn title="Team 1" players={team1} color="primary" tv={tv} />
        <TeamColumn title="Team 2" players={team2} color="accent" tv={tv} />
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
          <PlayerChip key={p.id} player={p} tv={tv} />
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
}: {
  title: string;
  players: Player[];
  color: string;
  tv: boolean;
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
        <PlayerChip key={p.id} player={p} tv={tv} />
      ))}
      {players.length === 0 && (
        <p className={`text-muted-foreground italic ${tv ? "text-lg" : "text-sm"}`}>
          Waiting for players...
        </p>
      )}
    </div>
  </div>
);

const PlayerChip = ({ player, tv }: { player: Player; tv: boolean }) => (
  <div
    className={`flex items-center gap-2 bg-muted/50 rounded-lg ${
      tv ? "px-5 py-3 gap-3" : "px-3 py-2"
    }`}
  >
    <PlayerAvatar player={player} size={tv ? "row" : "chip"} />
    <span
      className={`font-body font-medium text-foreground truncate ${
        tv ? "text-lg" : "text-sm"
      }`}
    >
      {player.name}
    </span>
    {player.score > 0 && (
      <span className={`ml-auto font-bold text-primary ${tv ? "text-base" : "text-xs"}`}>
        {player.score}
      </span>
    )}
  </div>
);

export default PlayerList;
