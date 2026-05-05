import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "コラム | ドストライクAI",
  description:
    "顔タイプ別作品ガイドやFANZA活用術など、あなたの「好み」を深掘りするコラムを掲載しています。",
  alternates: { canonical: "https://dostrike-ai.vercel.app/column" },
  openGraph: {
    url: "https://dostrike-ai.vercel.app/column",
    title: "コラム | ドストライクAI",
    description: "顔タイプ・作品選びに役立つコラムを掲載。",
  },
};

const ARTICLES = [
  {
    slug: "face-type-guide",
    category: "顔タイプ解説",
    categoryColor: "bg-pink-100 text-pink-700",
    title: "清楚系・ギャル系・クール系…FANZAで人気の女優タイプを30パターンで徹底分類",
    description:
      "人が「好み」と感じる女性の顔には、実は共通した特徴があります。ドストライクAIが採用する30の顔タイプを6つの大グループに分けて解説。自分の好みを言語化し、理想のコンテンツ探しに役立てましょう。",
    date: "2026年4月15日",
    readMin: 8,
    emoji: "🌸",
  },
  {
    slug: "how-to-find",
    category: "活用ガイド",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "AIで「理想の作品」を見つける方法——顔タイプ診断からFANZA活用まで完全解説",
    description:
      "「好みはあるけど、どう探せばいいかわからない」——そんな悩みをAIが解決します。顔タイプを登録するだけで、数万本の中からあなた専用のレコメンドを生成する仕組みと活用のコツを解説します。",
    date: "2026年4月15日",
    readMin: 6,
    emoji: "🤖",
  },
];

export default function ColumnIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground font-extrabold text-lg hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" /> トップへ
        </Link>
        <Link href="/dashboard" className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
          AIマッチを試す
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 md:py-16">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">コラム</h1>
        </div>
        <p className="text-foreground/60 text-sm mb-10 leading-relaxed">
          顔タイプ解説・作品の選び方・FANZA活用術など、あなたの「好み探し」に役立つ記事を掲載しています。
        </p>

        {/* 記事一覧 */}
        <div className="space-y-5">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/column/${article.slug}`}
              className="group block bg-card border border-border rounded-3xl p-6 md:p-8 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0 mt-1">{article.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${article.categoryColor}`}>
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1 text-foreground/40 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>約{article.readMin}分で読める</span>
                    </div>
                    <span className="text-foreground/30 text-xs">{article.date}</span>
                  </div>
                  <h2 className="font-extrabold text-base md:text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-xs md:text-sm text-foreground/60 leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1 hidden sm:block" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-8 text-center">
          <p className="text-sm text-foreground/60 mb-2">コラムを読んだら、実際に試してみましょう</p>
          <h3 className="font-extrabold text-xl mb-4">AIがあなたのドストライクを見つけます</h3>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_20px_rgba(244,63,94,0.3)]"
          >
            無料で試してみる <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
