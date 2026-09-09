"use client";

import { useState } from "react";

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

/** Official FPL player photo CDN. Falls back to initials if it 404s. */
export default function PlayerPhoto({
  code,
  name,
  size = 40,
}: {
  code: number;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const height = Math.round(size * (140 / 110));

  if (failed) {
    return (
      <div
        style={{ width: size, height }}
        className="flex flex-shrink-0 items-center justify-center rounded bg-black/10 text-xs font-bold text-black/50 dark:bg-white/10 dark:text-white/50"
      >
        {initials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party CDN, no build-time optimization needed
    <img
      src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`}
      alt={name}
      width={size}
      height={height}
      className="flex-shrink-0 rounded bg-black/5 object-cover dark:bg-white/10"
      onError={() => setFailed(true)}
    />
  );
}
