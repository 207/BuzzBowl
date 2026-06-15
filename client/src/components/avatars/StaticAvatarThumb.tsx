import type { AvatarId } from "@/lib/avatarModels";
import { AVATAR_THUMB_PX, useAvatarThumbCache } from "@/components/avatars/AvatarThumbCache";

export function StaticAvatarThumb({
  avatarId,
  className,
}: {
  avatarId: AvatarId;
  className?: string;
}) {
  const cache = useAvatarThumbCache();
  const src = cache[avatarId];

  return (
    <div
      className={`shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width: AVATAR_THUMB_PX, height: AVATAR_THUMB_PX }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={AVATAR_THUMB_PX}
          height={AVATAR_THUMB_PX}
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-md bg-muted/80" />
      )}
    </div>
  );
}
