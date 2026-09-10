// The official FPL API sits behind Cloudflare and occasionally 403s a
// request for no discoverable reason (seen from Vercel's build servers).
// A browser-like User-Agent avoids most of it; a couple of retries with
// backoff cover the rest so one flaky response can't fail a whole build.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Revalidate every 5 minutes so we're not hammering the official API on
// every request, but data stays close to real-time.
export const FPL_REVALIDATE_SECONDS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetches a URL on the official FPL API with a browser User-Agent and
 * retry-with-backoff, so one flaky response doesn't fail a whole build or
 * request. Shared by every FPL API caller in the app. */
export async function fetchFplJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Next's fetch cache keys on URL + options, so a retry of the exact
    // same request can be served the previous (failed) response instead
    // of hitting the network again. Bust the cache key on retries only,
    // so the first, most-common-case attempt keeps its canonical URL.
    const attemptUrl = attempt === 1 ? url : `${url}${url.includes("?") ? "&" : "?"}_retry=${attempt}`;
    try {
      const res = await fetch(attemptUrl, {
        next: { revalidate: FPL_REVALIDATE_SECONDS },
        headers: { "User-Agent": BROWSER_USER_AGENT },
      });
      if (res.ok) return (await res.json()) as T;
      lastError = new Error(`FPL API responded with ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
  }
  throw lastError;
}
