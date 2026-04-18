import { useEffect, useState } from "react";

function secondsLeft(deadlineMs: number | null): number | null {
  if (deadlineMs == null) return null;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function AnswerCountdown({
  answerDeadlineMs,
  maxSeconds,
  className,
  compact,
}: {
  answerDeadlineMs: number | null;
  /** Optional display cap to avoid +1 from client/server clock skew. */
  maxSeconds?: number;
  className?: string;
  /** Smaller digits for secondary placement */
  compact?: boolean;
}) {
  const cap = (n: number | null) =>
    n == null || maxSeconds == null ? n : Math.min(maxSeconds, n);
  const [left, setLeft] = useState<number | null>(() => cap(secondsLeft(answerDeadlineMs)));

  useEffect(() => {
    setLeft(cap(secondsLeft(answerDeadlineMs)));
    if (answerDeadlineMs == null) return;
    const id = window.setInterval(() => {
      setLeft(cap(secondsLeft(answerDeadlineMs)));
    }, 200);
    return () => window.clearInterval(id);
  }, [answerDeadlineMs, maxSeconds]);

  if (left == null) return null;

  return (
    <div
      className={
        className ??
        "mt-4 flex flex-col items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 py-6"
      }
    >
      <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">Answer time</p>
      <p
        className={`font-heading font-black tabular-nums text-primary ${
          compact ? "text-3xl" : "text-5xl"
        }`}
      >
        {left}
      </p>
    </div>
  );
}
