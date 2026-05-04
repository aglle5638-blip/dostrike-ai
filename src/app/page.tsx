import { ArrowRight, Sparkles, ChevronRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ドストライクAI | AIがあなたのドストライクを探し出す",
  description:
    "顔タイプを選ぶだけ。AIがFANZAの数万本からあなたのドストライク動画をキュレーション。清楚系・ギャル系・クール系など30タイプから好みを選択するだけで、AIがマッチした作品を自動提案。完全無料。※18歳以上限定",
  alternates: { canonical: "https://dostrike-ai.vercel.app" },
  openGraph: {
    url: "https://dostrike-ai.vercel.app",
    title: "ドストライクAI | AIがあなたのドストライクを探し出す",
    description:
      "顔タイプを選ぶだけ。AIがFANZAの数万本からあなただけのドストライク動画をキュレーション。",
  },
};

const FACE_GROUPS = [
  { emoji: "🌸", name: "清楚系", desc: "黒髪・色白・スレンダーな上品さ", color: "bg-pink-50 border-pink-200 text-pink-700" },
  { emoji: "💗", name: "キュート系", desc: "童顔・小顔・アイドル的かわいさ", color: "bg-rose-50 border-rose-200 text-rose-600" },
  { emoji: "💄", name: "お姉さん系", desc: "20代後半〜の落ち着いた色気", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { emoji: "💅", name: "ギャル系", desc: "金髪・日焼け・派手で情熱的", color: "bg-orange-50 border-orange-200 text-orange-600" },
  { emoji: "🖤", name: "クール系", desc: "知的・モデル系・ミステリアス", color: "bg-slate-50 border-slate-200 text-slate-600" },
  { emoji: "🌿", name: "その他・個性派", desc: "和風美人・褐色系・スポーティ", color: "bg-green-50 border-green-200 text-green-700" },
];

const ARTICLES = [
  {
    slug: "face-type-guide",
    emoji: "🌸",
    category: "顔タイプ解説",
    categoryColor: "bg-pink-100 text-pink-700",
    title: "清楚系・ギャル系・クール系…FANZAで人気の女優タイプを30パターンで徹底分類",
    readMin: 8,
  },
  {
    slug: "how-to-find",
    emoji: "🤖",
    category: "活用ガイド",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "AIで「理想の作品」を見つける方法——顔タイプ診断からFANZA活用まで完全解説",
    readMin: 6,
  },
];

const STEPS = [
  { num: "01", title: "好みの女優をスワイプ", desc: "体型・身長・年代・雰囲気などの条件を選んで女優写真を左右にスワイプ" },
  { num: "02", title: "AIが好みを分析", desc: "スワイプ結果をもとにAIがあなたの好みタイプを自動で解析" },
  { num: "03", title: "ドストライク作品を提案", desc: "FANZAの膨大なコンテンツから好みに合う作品をAIがリアルタイムでキュレーション" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ヘッダーナビ */}
      <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
          <div className="bg-primary p-1 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          ドストライク<span className="text-primary">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/column" className="hidden sm:flex items-center gap-1 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors">
            <BookOpen className="w-4 h-4" /> コラム
          </Link>
          <Link href="/dashboard" className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(244,63,94,0.3)]">
            AIマッチを試す
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ヒーローセクション */}
        <section className="relative overflow-hidden px-4 py-16 md:py-24 text-center">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -top-[40%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute -bottom-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-accent/10 blur-[120px]" />
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-card border border-primary/20 px-5 py-2 rounded-full shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-bold">FANZAアフィリエイト連携 · 数万本対応</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
              あなたの<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">「ドストライク」</span>をAIが探し出す
            </h1>

            <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-10">
              好みの女優写真を<strong className="text-foreground">スワイプするだけ</strong>でAIが好みを学習。
              体型・身長・年代・雰囲気まで細かく指定して、あなただけのドストライク作品をFANZAからキュレーションします。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-extrabold text-white bg-primary rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.7)]"
              >
                <span className="relative flex items-center gap-2 tracking-wide">
                  無料ではじめる <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/column"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-foreground bg-card border border-border shadow-sm rounded-full transition-all hover:bg-secondary"
              >
                <BookOpen className="w-4 h-4" /> コラムを読む
              </Link>
            </div>
          </div>
        </section>

        {/* 使い方ステップ */}
        <section className="px-4 py-12 md:py-16 bg-secondary/30 border-y border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-extrabold text-center mb-10">
              たった3ステップで、理想の作品と出会える
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <div key={step.num} className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm">
                  <div className="text-4xl font-extrabold text-primary/20 mb-3">{step.num}</div>
                  <h3 className="font-extrabold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 顔タイプ紹介 */}
        <section className="px-4 py-14 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-extrabold mb-3">スワイプで好みを伝えるだけ</h2>
              <p className="text-foreground/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                好みの女優写真を右スワイプ（好き）・左スワイプ（パス）するだけ。
                AIがスワイプパターンを分析し、FANZAの作品と自動でマッチングします。
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              {[
                { emoji: "🌿", label: "体型", desc: "スレンダー・グラマーなど", color: "bg-green-50 border-green-200 text-green-700" },
                { emoji: "💃", label: "身長", desc: "小柄・標準・高身長", color: "bg-blue-50 border-blue-200 text-blue-700" },
                { emoji: "🕐", label: "年代", desc: "10代〜30代以上", color: "bg-purple-50 border-purple-200 text-purple-700" },
                { emoji: "🌸", label: "雰囲気", desc: "清楚系・セクシー系など", color: "bg-pink-50 border-pink-200 text-pink-700" },
              ].map((item) => (
                <div key={item.label} className={`border rounded-2xl p-4 md:p-5 flex flex-col gap-2 ${item.color}`}>
                  <div className="text-3xl">{item.emoji}</div>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base">{item.label}</h3>
                    <p className="text-[11px] md:text-xs leading-relaxed opacity-70 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/column/face-type-guide" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                各タイプの詳細解説を読む <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* コラムセクション */}
        <section className="px-4 py-14 md:py-20 bg-secondary/30 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold">最新コラム</h2>
              <Link href="/column" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                すべて見る <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/column/${article.slug}`}
                  className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">{article.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${article.categoryColor}`}>
                          {article.category}
                        </span>
                        <div className="flex items-center gap-1 text-foreground/40 text-xs">
                          <Clock className="w-3 h-3" /><span>約{article.readMin}分</span>
                        </div>
                      </div>
                      <p className="font-bold text-sm md:text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1 hidden sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 最終CTA */}
        <section className="px-4 py-16 md:py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
              さっそく、試してみませんか？
            </h2>
            <p className="text-foreground/60 mb-8 leading-relaxed text-sm md:text-base">
              スワイプするだけ。登録不要・完全無料でAIマッチングを体験できます。
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-full font-extrabold text-base hover:bg-primary/90 transition-colors shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] hover:scale-105 transition-all"
            >
              無料ではじめる <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-foreground/30 mt-4">※本サービスは18歳以上を対象としています</p>
          </div>
        </section>

      </main>

      {/* フッター */}
      <footer className="border-t border-border px-4 py-8 bg-card/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-extrabold">
            <div className="bg-primary p-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            ドストライク<span className="text-primary">AI</span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-foreground/50 font-bold flex-wrap justify-center">
            <Link href="/column" className="hover:text-foreground transition-colors">コラム</Link>
            <Link href="/guide" className="hover:text-foreground transition-colors">ご利用ガイド</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</Link>
          </nav>
        </div>
        <p className="text-center text-xs text-foreground/30 mt-6">
          © 2026 ドストライクAI · 本サービスはFANZAアフィリエイトプログラムを利用しています
        </p>
      </footer>

    </div>
  );
}
