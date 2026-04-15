import { Player, GameMode } from "@/lib/gameTypes";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface PlayerListProps {
  players: Player[];
  mode: GameMode;
}

const PlayerList = ({ players, mode }: PlayerListProps) => {
  const team1 = players.filter((p) => p.team === 1);
  const team2 = players.filter((p) => p.team === 2);

  if (mode === "teams") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamColumn title="Team 1" players={team1} color="primary" />
        <TeamColumn title="Team 2" players={team2} color="accent" />
      </div>
    );
  }

  return (
    <div className="game-card p-5">
      <h3 className="font-heading font-bold text-lg mb-3 text-foreground">
        Players ({players.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map((p) => (
          <PlayerChip key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
};

const TeamColumn = ({
  title,
  players,
  color,
}: {
  title: string;
  players: Player[];
  color: string;
}) => (
  <div className="game-card p-5">
    <h3
      className={`font-heading font-bold text-lg mb-3 ${
        color === "primary" ? "text-primary" : "text-accent"
      }`}
    >
      {title}
    </h3>
    <div className="space-y-2">
      {players.map((p) => (
        <PlayerChip key={p.id} player={p} />
      ))}
      {players.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Waiting for players...</p>
      )}
    </div>
  </div>
);

const PlayerChip = ({ player }: { player: Player }) => (
  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
    <PlayerAvatar player={player} size="chip" />
    <span className="font-body font-medium text-sm text-foreground truncate">
      {player.name}
    </span>
    {player.score > 0 && (
      <span className="ml-auto text-xs font-bold text-primary">
        {player.score}
      </span>
    )}
  </div>
);

export default PlayerList;
