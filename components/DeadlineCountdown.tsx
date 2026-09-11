"use client";

import { useEffect, useState } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "deadline's passed";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/** A live-ticking countdown to the next gameweek's deadline. Client-only -
 * renders nothing until mounted so the server (which doesn't know "now"
 * at the moment the viewer loads the page) can't drift out of sync with
 * the client's own clock. */
export default function DeadlineCountdown({
  deadline,
  eventName,
}: {
  deadline: string;
  eventName: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => setNow(Date.now()));
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (now === null) return null;

  const remaining = Date.parse(deadline) - now;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-600/30 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 dark:border-purple-400/30 dark:bg-purple-950/40 dark:text-purple-300">
      <span aria-hidden="true">⏱</span>
      <span>
        {eventName} deadline: {formatCountdown(remaining)}
      </span>
    </div>
  );
}
