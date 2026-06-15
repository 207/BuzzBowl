import type { AvatarAnimationClip } from "@/lib/avatarModels";
import type { Player } from "@/lib/gameTypes";
import { AnimatedAvatarCanvas, type AvatarCanvasSize } from "@/components/avatars/AnimatedAvatarCanvas";

const imgSizes: Record<AvatarCanvasSize, string> = {
  chip: "h-8 w-8",
  lobby: "h-14 w-14",
  row: "h-10 w-10",
  podium: "h-20 w-20",
  hero: "h-52 w-52",
};

export function PlayerAvatar({
  player,
  size = "chip",
  clip = "idle",
  framed,
}: {
  player: Pick<Player, "avatarId" | "selfieDataUrl">;
  size?: AvatarCanvasSize;
  clip?: AvatarAnimationClip;
  /** Defaults to true except for `lobby` size */
  framed?: boolean;
}) {
  const showFrame = framed ?? size !== "lobby";
  if (player.selfieDataUrl) {
    return (
      <img
        src={player.selfieDataUrl}
        alt=""
        className={`shrink-0 object-cover ${showFrame ? `rounded-full ring-1 ring-border ${imgSizes[size]}` : imgSizes[size]}`}
      />
    );
  }
  return (
    <AnimatedAvatarCanvas
      avatarId={player.avatarId}
      clip={clip}
      size={size}
      framed={showFrame}
    />
  );
}
