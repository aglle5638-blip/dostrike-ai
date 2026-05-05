import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";

export default function VipPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="hidden sm:flex w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-foreground font-extrabold text-lg hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> ホームに戻る
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center p-5 bg-secondary rounded-full mb-6">
          <Crown className="w-12 h-12 text-foreground/20" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">VIPプラン</h1>
        <p className="text-foreground/50 text-lg font-bold mb-2">準備中</p>
        <p className="text-foreground/40 text-sm max-w-sm leading-relaxed">
          VIPプランは現在準備中です。近日公開予定ですので、しばらくお待ちください。
        </p>
        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-colors"
        >
          ホームに戻る
        </Link>
      </main>
    </div>
  );
}
