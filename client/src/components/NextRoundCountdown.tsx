import { useEffect, useMemo, useState } from "react";
import { COUNTDOWN_WAIT_BLURBS } from "@/lib/countdownBlurbs";

function secondsLeft(deadlineMs: number | null): number | null {
  if (deadlineMs == null) return null;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

/** One blurb for this countdown (stable until `countdownDeadlineMs` changes). */
function blurbForDeadline(deadlineMs: number): string {
  let x = deadlineMs | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const i = Math.abs(x) % COUNTDOWN_WAIT_BLURBS.length;
  return COUNTDOWN_WAIT_BLURBS[i]!;
}

/** Shown between rounds while the server waits before loading the next question. */
export function NextRoundCountdown({ countdownDeadlineMs }: { countdownDeadlineMs: number | null }) {
  const cap = (n: number | null) => (n == null ? n : Math.min(3, n));
  const [left, setLeft] = useState<number | null>(() => cap(secondsLeft(countdownDeadlineMs)));

  const blurb = useMemo(() => {
    if (countdownDeadlineMs == null) return COUNTDOWN_WAIT_BLURBS[0];
    return blurbForDeadline(countdownDeadlineMs);
  }, [countdownDeadlineMs]);

  useEffect(() => {
    setLeft(cap(secondsLeft(countdownDeadlineMs)));
    if (countdownDeadlineMs == null) return;
    const id = window.setInterval(() => setLeft(cap(secondsLeft(countdownDeadlineMs))), 200);
    return () => window.clearInterval(id);
  }, [countdownDeadlineMs]);

  if (left == null) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 px-8 py-10">
      <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">Next question in</p>
      <p className="font-heading text-6xl font-black tabular-nums text-primary">{left}</p>
      <p className="max-w-xs text-center text-sm italic text-muted-foreground font-body leading-snug">{blurb}</p>
    </div>
  );
}
