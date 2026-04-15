import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AgeGate from "@/components/AgeGate";
import { AuthProvider } from "@/components/AuthProvider";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://dostrike-ai.vercel.app";
const SITE_NAME = "ドストライクAI";
const DEFAULT_DESCRIPTION =
  "AIがあなたの好みの顔タイプを解析し、数万本の中から最もマッチする動画を独自スコアで推薦。30種類のタイプから選ぶだけで、あなただけのパーソナルキュレーションが完成します。※18歳以上限定";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── 基本 ──────────────────────────────────────────────────────
  title: {
    default: `${SITE_NAME} | AIがあなたのドストライクを探し出す`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["AI", "動画", "キュレーション", "マッチング", "アダルト", "FANZA", "おすすめ"],
  authors: [{ name: "ドストライクAI 運営事務局" }],
  creator: "ドストライクAI",

  // ── OGP (Open Graph) ─────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | AIがあなたのドストライクを探し出す`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – AIがあなたのドストライクを探し出す`,
      },
    ],
  },

  // ── Twitter / X Card ────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | AIがあなたのドストライクを探し出す`,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },

  // ── Robots ───────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── その他 ───────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} antialiased h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans pb-[75px] sm:pb-0">
        <AuthProvider>
          <AgeGate />
          {children}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
