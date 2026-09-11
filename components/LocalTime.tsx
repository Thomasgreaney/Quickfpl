"use client";

import { useEffect, useState } from "react";

/** Renders an ISO timestamp as a clock time in the viewer's own local
 * timezone (e.g. "14:32") - client-only since the server can't know the
 * viewer's timezone, so it renders nothing until mounted rather than
 * guessing and risking a hydration mismatch. */
export default function LocalTime({ iso }: { iso: string }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setFormatted(new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    });
  }, [iso]);

  if (!formatted) return null;
  return <>{formatted}</>;
}
