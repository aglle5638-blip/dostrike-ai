import { ArrowRight, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ドストライクAI | AIがあなたのドストライクを探し出す",
  description:
    "顔写真を登録するだけ。最新AIが骨格・パーツを高次元解析し、数万本の中からあなただけのドストライク動画をキュレーション。完全無料で今すぐ試せます。※18歳以上限定",
  alternates: { canonical: "https://dostrike-ai.vercel.app" },
  openGraph: {
    url: "https://dostrike-ai.vercel.app",
    title: "ドストライクAI | AIがあなたのドストライクを探し出す",
    description:
      "顔写真を登録するだけ。AIが数万本の中からあなただけのドストライク動画をキュレーション。",
  },
};

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-br from-background via-secondary/10 to-secondary overflow-hidden relative">
      <div className="max-w-3xl space-y-8 relative z-10 w-full">
        <div className="flex items-center gap-2 mb-8 bg-card border border-primary/20 backdrop-blur px-5 py-2 rounded-full shadow-lg mx-auto w-fit">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">AI顔認証マッチング v3.1 稼働中</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] drop-shadow-sm">
          あなたの<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">「ドストライク」</span>を<br/>
          AIが探し出す
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium">
          顔写真を登録するだけ。最新のAI技術が骨格やパーツの特徴を高次元で解析し、数あるコンテンツの中からあなただけのための至極の作品をキュレーションします。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/login" 
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-primary rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.8)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center gap-2 tracking-wide font-extrabold">
              無料ではじめる <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-foreground bg-card border border-border shadow-sm rounded-full transition-all hover:bg-secondary hover:text-primary">
            <Play className="w-4 h-4" />
            デモを見る
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-accent/10 blur-[120px]" />
      </div>
    </div>
  );
}
