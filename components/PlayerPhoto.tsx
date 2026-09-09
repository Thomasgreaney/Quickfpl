"use client";

import { useState } from "react";

/** Generic silhouette shown when a player has no real photo available. */
function PhotoPlaceholder({ size, height }: { size: number; height: number }) {
  return (
    <div
      style={{ width: size, height }}
      title="No photo available"
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/10"
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        fill="currentColor"
        className="text-black/25 dark:text-white/25"
        aria-hidden="true"
      >
        <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9Z" />
      </svg>
    </div>
  );
}

/** Official FPL player photo CDN. Falls back to a generic silhouette if it 404s. */
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

  if (failed) {
    return <PhotoPlaceholder size={size} height={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party CDN, no build-time optimization needed
    <img
      src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`}
      alt={name}
      width={size}
      height={size}
      className="flex-shrink-0 rounded-full bg-black/5 object-cover dark:bg-white/10"
      onError={() => setFailed(true)}
    />
  );
}
