// Set on Vercel once there's a real Google AdSense account for the site
// (Settings -> Environment Variables): NEXT_PUBLIC_ADSENSE_CLIENT_ID,
// looks like "ca-pub-1234567890123456". Until it's set, AdSlot and the
// loader script below render nothing - no placeholder boxes shown to
// visitors for an ad network that isn't actually configured yet.
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null;
