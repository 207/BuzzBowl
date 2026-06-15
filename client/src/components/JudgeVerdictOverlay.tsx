import type { AvatarId } from "@/lib/avatarModels";
import { avatarDisplayName } from "@/lib/avatarModels";
import { AnimatedAvatarCanvas } from "@/components/avatars/AnimatedAvatarCanvas";

export function JudgeVerdictOverlay({
  verdict,
  judgeAvatarId,
  judgeName,
}: {
  verdict: "correct" | "incorrect";
  judgeAvatarId: AvatarId;
  judgeName: string;
}) {
  const clip = verdict === "correct" ? "gesture-positive" : "gesture-negative";
  const label = verdict === "correct" ? "Correct!" : "Incorrect";
  const tone =
    verdict === "correct"
      ? "border-emerald-500/40 bg-emerald-500/10"
      : "border-destructive/40 bg-destructive/10";

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-6 backdrop-blur-sm">
      <div
        className={`flex max-w-sm flex-col items-center gap-3 rounded-3xl border px-8 py-8 shadow-2xl ${tone}`}
      >
        <AnimatedAvatarCanvas avatarId={judgeAvatarId} clip={clip} size="hero" />
        <p className="text-3xl font-heading font-extrabold text-foreground">{label}</p>
        <p className="text-sm font-body text-muted-foreground">
          {judgeName} · Judge
        </p>
        <p className="text-xs font-body text-muted-foreground">
          {avatarDisplayName(judgeAvatarId)}
        </p>
      </div>
    </div>
  );
}
