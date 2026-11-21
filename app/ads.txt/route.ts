import { ADSENSE_CLIENT_ID } from "@/lib/ads";

// AdSense requires ads.txt at the site root naming the publisher ID before
// it'll actually serve ads - empty until NEXT_PUBLIC_ADSENSE_CLIENT_ID is
// set, so this just works the moment that env var is added, no further
// code changes needed.
export async function GET() {
  const body = ADSENSE_CLIENT_ID
    ? `google.com, ${ADSENSE_CLIENT_ID.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "";
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
