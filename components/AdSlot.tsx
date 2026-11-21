"use client";

import { useEffect, useRef, useState } from "react";
import { MEMBER_EMAIL_STORAGE_KEY } from "@/lib/member-storage";
import { ADSENSE_CLIENT_ID } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** A Google AdSense display unit, shown to everyone except visitors who've
 * paid to go ad-free. Renders nothing at all - not even a placeholder box -
 * until NEXT_PUBLIC_ADSENSE_CLIENT_ID is actually set, so there's no
 * "ad space" clutter for a network that isn't configured yet. Once it is,
 * each spot just needs its own AdSense ad-unit slot ID. */
export default function AdSlot({ adSlotId }: { adSlotId: string }) {
  const [adFree, setAdFree] = useState<boolean | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const saved = window.localStorage.getItem(MEMBER_EMAIL_STORAGE_KEY);
        if (!saved) {
          setAdFree(false);
          return;
        }
        const res = await fetch(`/api/membership?email=${encodeURIComponent(saved)}`);
        const data: { adFree: boolean } = await res.json();
        setAdFree(data.adFree);
      } catch {
        setAdFree(false);
      }
    });
  }, []);

  useEffect(() => {
    if (adFree !== false || !ADSENSE_CLIENT_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded yet (or blocked by an ad blocker) - the
      // slot just stays empty, nothing to recover from here.
    }
  }, [adFree]);

  if (!ADSENSE_CLIENT_ID || adFree !== false) return null;

  return (
    <ins
      className="adsbygoogle my-6 block"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adSlotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
