import type { MetadataRoute } from "next";

const SITE_URL = "https://quickfpl.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/squad`, lastModified, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/insights`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/planner`, lastModified, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/assistant`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/pricing`, lastModified, changeFrequency: "weekly", priority: 0.5 },
  ];
}
