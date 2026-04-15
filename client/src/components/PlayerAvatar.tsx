import type { Player } from "@/lib/gameTypes";

const styles = {
  chip: { img: "h-8 w-8", em: "text-xl" },
  podium: { img: "h-14 w-14", em: "text-3xl" },
  row: { img: "h-9 w-9", em: "text-xl" },
} as const;

export function PlayerAvatar({
  player,
  size = "chip",
}: {
  player: Pick<Player, "avatar" | "selfieDataUrl">;
  size?: keyof typeof styles;
}) {
  const s = styles[size];
  if (player.selfieDataUrl) {
    return (
      <img
        src={player.selfieDataUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ring-1 ring-border ${s.img}`}
      />
    );
  }
  return <span className={`shrink-0 leading-none ${s.em}`}>{player.avatar}</span>;
}
