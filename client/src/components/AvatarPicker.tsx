import {
  AVATAR_IDS,
  avatarDisplayName,
  type AvatarId,
} from "@/lib/avatarModels";
import { StaticAvatarThumb } from "@/components/avatars/StaticAvatarThumb";
import { AvatarThumbCacheProvider } from "@/components/avatars/AvatarThumbCache";

export function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarId;
  onChange: (id: AvatarId) => void;
}) {
  return (
    <AvatarThumbCacheProvider>
      <div className="space-y-2">
        <label className="text-sm font-body font-medium text-foreground">Choose avatar</label>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-muted/30 p-2 scrollbar-themed">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {AVATAR_IDS.map((id) => {
              const selected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange(id)}
                  className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                    selected
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "hover:bg-muted/80"
                  }`}
                  aria-label={avatarDisplayName(id)}
                  aria-pressed={selected}
                  title={avatarDisplayName(id)}
                >
                  <StaticAvatarThumb avatarId={id} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AvatarThumbCacheProvider>
  );
}
