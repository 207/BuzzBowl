import { useEffect, useState } from "react";
import { JudgeVerdictOverlay } from "@/components/JudgeVerdictOverlay";
import type { AvatarId } from "@/lib/avatarModels";

export function JudgeVerdictFlash({
  flash,
  judgeAvatarId,
  judgeName,
}: {
  flash: {
    judgePlayerId: string;
    verdict: "correct" | "incorrect";
    deadlineMs: number;
  } | null | undefined;
  judgeAvatarId: AvatarId;
  judgeName: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!flash) {
      setVisible(false);
      return;
    }
    setVisible(Date.now() < flash.deadlineMs);
    const ms = Math.max(0, flash.deadlineMs - Date.now());
    const id = window.setTimeout(() => setVisible(false), ms);
    return () => window.clearTimeout(id);
  }, [flash]);

  if (!flash || !visible) return null;

  return (
    <JudgeVerdictOverlay
      verdict={flash.verdict}
      judgeAvatarId={judgeAvatarId}
      judgeName={judgeName}
    />
  );
}
