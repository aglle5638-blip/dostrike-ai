import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AgeGate from "@/components/AgeGate";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ドストライクAI | あなたの好みを完全解析する動画キュレーション",
  description: "AIがあなたの好みの顔を完全解析し、最もマッチするプレミアムコンテンツを独自のスコアで推薦する次世代プラットフォーム。",
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
        <AgeGate />
        {children}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
