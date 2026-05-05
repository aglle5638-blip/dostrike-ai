import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/column", "/column/face-type-guide", "/column/how-to-find", "/guide", "/terms", "/privacy"],
        disallow: ["/dashboard", "/mypage", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://dostrike-ai.vercel.app/sitemap.xml",
  };
}
