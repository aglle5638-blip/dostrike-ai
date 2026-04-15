import type { MetadataRoute } from "next";

const BASE_URL = "https://dostrike-ai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-04-14"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-04-14"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
