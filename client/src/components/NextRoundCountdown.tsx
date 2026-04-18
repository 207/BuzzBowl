import { useEffect, useState } from "react";

function secondsLeft(deadlineMs: number | null): number | null {
  if (deadlineMs == null) return null;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

/** Shown between rounds while the server waits before loading the next question. */
export function NextRoundCountdown({ countdownDeadlineMs }: { countdownDeadlineMs: number | null }) {
  const [left, setLeft] = useState<number | null>(() => secondsLeft(countdownDeadlineMs));

  useEffect(() => {
    setLeft(secondsLeft(countdownDeadlineMs));
    if (countdownDeadlineMs == null) return;
    const id = window.setInterval(() => setLeft(secondsLeft(countdownDeadlineMs)), 200);
    return () => window.clearInterval(id);
  }, [countdownDeadlineMs]);

  if (left == null) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-8 py-10">
      <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">Next question in</p>
      <p className="font-heading text-6xl font-black tabular-nums text-primary">{left}</p>
    </div>
  );
}
