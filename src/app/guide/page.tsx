import Link from "next/link";
import { BookOpen, Sparkles, AlertCircle, ArrowLeft, Heart, ChevronRight, ChevronLeft } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="hidden sm:flex w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground font-extrabold text-lg hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" /> ホームに戻る
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-16">

        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            ドストライクAI ご利用ガイド
          </h1>
          <p className="text-foreground/70 text-sm md:text-base leading-relaxed">
            AIを使って、あなただけの「理想のライブラリ」を育てる方法を解説します。
          </p>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Step 1 */}
          <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-lg">1</div>
              <h2 className="text-xl font-extrabold">好みの女優をスワイプして教える</h2>
            </div>
            <p className="text-foreground/70 mb-6 leading-relaxed text-sm md:text-base">
              初回ログイン後、女優の写真が1枚ずつ表示されます。好みの顔なら右スワイプ（または❤️ボタン）、そうでなければ左スワイプ（または✕ボタン）。たった10枚に答えるだけで、AIがあなたの好みを学習します。
            </p>
            <div className="bg-secondary/50 border border-border rounded-xl p-4 flex gap-4 items-center">
              <div className="flex gap-3 text-2xl">
                <ChevronLeft className="w-6 h-6 text-red-400" />
                <span className="text-foreground/60 font-bold text-sm self-center">スワイプで答えるだけ</span>
                <ChevronRight className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-foreground/60 font-bold">PC・スマホどちらでも操作可能。キーボードの矢印キーにも対応。</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-lg">2</div>
              <h2 className="text-xl font-extrabold">AIがあなた専用の「厳選6本」を提案</h2>
            </div>
            <p className="text-foreground/70 mb-4 leading-relaxed text-sm md:text-base">
              スワイプ完了後、好みの女優に近いタイプが出演する作品をFANZAのデータベースから自動抽出。あなただけのパーソナライズされたレコメンドが即座に表示されます。
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-primary/5 rounded-full blur-[50px] -z-10" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-lg">3</div>
              <h2 className="text-xl font-extrabold">フィードバックでAIをさらに育てる</h2>
            </div>
            <p className="text-foreground/70 mb-6 leading-relaxed text-sm md:text-base">
              提示された動画へのアクションが学習データになります。続けるほど、レコメンドがあなたの好みにぴったりフィットしていきます。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center text-center">
                <div className="bg-primary/20 p-2 rounded-full mb-3"><Sparkles className="w-5 h-5 text-primary fill-current" /></div>
                <h4 className="font-bold text-sm mb-1">いいね（👍）</h4>
                <p className="text-[11px] text-foreground/60">AIに「この傾向が超好み！」と強くアピールし、同等の作品を優先させます。</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center text-center">
                <div className="bg-yellow-400/20 p-2 rounded-full mb-3"><Heart className="w-5 h-5 text-yellow-500 fill-current" /></div>
                <h4 className="font-bold text-sm mb-1">キープ（💛）</h4>
                <p className="text-[11px] text-foreground/60">保存リストに追加。後でゆっくり確認したい作品に使いましょう。</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-2xl flex flex-col items-center text-center">
                <div className="bg-red-500/20 p-2 rounded-full mb-3"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                <h4 className="font-bold text-sm mb-1">チェンジ（👎）</h4>
                <p className="text-[11px] text-foreground/60">「これは違う」と思ったら押してください。次回から類似タイプを除外します。</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
