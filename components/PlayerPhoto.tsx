"use client";

import { useState } from "react";

// Try the crisp cutout size first; fall back to the smaller thumbnail size,
// which the CDN sometimes has even when the larger crop is missing (new
// signings, loanees, etc. can lag behind on the studio shot).
const SIZES = ["250x250", "40x40"];

const PALETTE = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
];

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function colourFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Shown when no CDN photo is available for a player - initials on a
 * deterministic colour so it's at least visually distinct, not a generic
 * "no photo" icon repeated for every unphotographed player. */
function PhotoPlaceholder({ size, name }: { size: number; name: string }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      title={name}
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${colourFor(name)}`}
    >
      {initials(name)}
    </div>
  );
}

/** Official FPL player photo CDN. Tries a couple of known sizes before
 * falling back to an initials placeholder. */
export default function PlayerPhoto({
  photoId,
  name,
  size = 40,
}: {
  photoId: string;
  name: string;
  size?: number;
}) {
  const [attempt, setAttempt] = useState(0);

  if (attempt >= SIZES.length) {
    return <PhotoPlaceholder size={size} name={name} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party CDN, no build-time optimization needed
    <img
      key={SIZES[attempt]}
      src={`https://resources.premierleague.com/premierleague/photos/players/${SIZES[attempt]}/p${photoId}.png`}
      alt={name}
      width={size}
      height={size}
      className="flex-shrink-0 rounded-full bg-black/5 object-cover dark:bg-white/10"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
