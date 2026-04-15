import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, Sparkles, Heart, ThumbsUp, ThumbsDown, Search, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIで「理想の作品」を見つける方法——顔タイプ診断からFANZA活用まで完全解説 | ドストライクAI コラム",
  description:
    "顔タイプを選ぶだけで、FANZAの数万本からあなた専用のレコメンドを自動生成。AIマッチングの仕組みと活用のコツを初心者にもわかりやすく解説します。",
  alternates: { canonical: "https://dostrike-ai.vercel.app/column/how-to-find" },
  openGraph: {
    url: "https://dostrike-ai.vercel.app/column/how-to-find",
    title: "AIで「理想の作品」を見つける方法 | ドストライクAI",
    description: "顔タイプ診断からFANZA活用まで、AI×好み探しの完全ガイド。",
  },
};

const STEPS = [
  {
    icon: "🎯",
    title: "顔タイプを選ぶ（最大5つ）",
    desc: "ダッシュボードの「好みのタイプ」エリアから、30パターンの顔タイプの中でピンときたものを選びます。1つだけでもOKですが、2〜3つ登録するとレコメンドの幅が広がります。",
    tip: "「清楚系×キュート系」「お姉さん系×クール系」など、複数タイプを組み合わせるとより精度が上がります。",
  },
  {
    icon: "⚡",
    title: "AIがFANZA作品をスコアリング",
    desc: "タイプを登録すると、AIがFANZAのデータベースを参照し、選んだ顔タイプとのマッチ度（0〜100%）を計算。マッチスコアの高い順に6本の作品が表示されます。",
    tip: "「いいね順」以外にも、売上ランキング順・新着順・レビュー評価順などソート変更も可能です。",
  },
  {
    icon: "💛",
    title: "フィードバックでAIを育てる",
    desc: "表示された作品に対してアクションすることで、AIの学習データが蓄積されます。フィードバックするほど、翌日以降のレコメンドが自分好みに最適化されていきます。",
    tip: "「チェンジ（👎）」を押した作品のタイプはAIが学習し、以降のレコメンドから除外していきます。",
  },
  {
    icon: "📚",
    title: "保存リストを活用する",
    desc: "「キープ（💛）」した作品は保存リストにストック。あとでじっくり確認したいときや、FANZAで視聴するタイミングを見計らいながらリストを育てていきましょう。",
    tip: "保存リストはログインすることでデバイスをまたいで同期されます。スマホで保存・PCで視聴なども可能です。",
  },
];

const FEEDBACK_ITEMS = [
  {
    icon: <ThumbsUp className="w-4 h-4" />,
    label: "いいね（👍）",
    color: "bg-primary/10 text-primary border-primary/20",
    effect: "「この傾向が超好き」という強いシグナル。AIが同タイプを優先するようになります。",
  },
  {
    icon: <Heart className="w-4 h-4" />,
    label: "キープ（💛）",
    color: "bg-yellow-400/10 text-yellow-600 border-yellow-400/20",
    effect: "保存リストに追加。AIへの学習影響は弱めで、後から見返す用途に最適です。",
  },
  {
    icon: <ThumbsDown className="w-4 h-4" />,
    label: "チェンジ（👎）",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    effect: "「このタイプは違う」というシグナル。以降の類似タイプのスコアを下げます。",
  },
];

export default function HowToFindPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
        <Link href="/column" className="flex items-center gap-2 text-foreground font-extrabold text-sm hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> コラム一覧
        </Link>
        <Link href="/dashboard" className="px-4 py-1.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
          AIマッチを試す
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 md:py-14">

        {/* 記事ヘッダー */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-700">活用ガイド</span>
            <div className="flex items-center gap-1 text-foreground/40 text-xs">
              <Clock className="w-3 h-3" /><span>約6分で読める</span>
            </div>
            <span className="text-foreground/30 text-xs">2026年4月15日</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug mb-4">
            AIで「理想の作品」を見つける方法<br className="hidden md:block" />
            ——顔タイプ診断から<br className="hidden md:block" />
            FANZA活用まで完全解説
          </h1>
          <p className="text-foreground/70 text-sm md:text-base leading-relaxed border-l-4 border-blue-300 pl-4">
            FANZAには毎月数千本の新作が追加されます。その中から「好みの作品」を探し続けるのは、正直かなり大変です。ドストライクAIは「顔タイプを選ぶだけ」でこの問題を解決します。仕組みと活用のコツをわかりやすく解説します。
          </p>
        </div>

        {/* 目次 */}
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 mb-10">
          <h2 className="font-extrabold text-sm mb-3 text-foreground/70">📋 この記事の目次</h2>
          <ol className="space-y-1.5">
            <li className="text-sm"><span className="text-primary font-bold mr-2">1.</span>「好み探し」の現状と課題</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">2.</span>ドストライクAIの仕組み</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">3.</span>4ステップで始めるAIマッチング</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">4.</span>フィードバック機能の使い方</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">5.</span>FANZAと組み合わせた活用術</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">6.</span>まとめ</li>
          </ol>
        </div>

        <div className="space-y-12 text-foreground/90 leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">1.</span>「好み探し」の現状と課題
            </h2>
            <p className="text-sm md:text-base mb-4">
              FANZAやその他のアダルトコンテンツプラットフォームを使っていて、こんな経験はありませんか？
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base pl-2 mb-4">
              <li>タイトルで探しても、自分好みの女優が出ていない</li>
              <li>特定の女優が好きだけど、その人の作品を見尽くしてしまった</li>
              <li>「系統は似ているけど微妙に違う」作品に何度も当たってしまう</li>
              <li>好みを言語化できないので、検索キーワードがうまく定まらない</li>
            </ul>
            <p className="text-sm md:text-base">
              こうした問題の根本は、「自分の好みが何か」を具体的に把握できていないことにあります。ドストライクAIは、この「言語化の壁」を「顔タイプの選択」というシンプルな操作で解決します。
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">2.</span> ドストライクAIの仕組み
            </h2>
            <p className="text-sm md:text-base mb-4">
              ドストライクAIは、以下の2つの軸でマッチングを行います。
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-sm">顔タイプ × キーワードマッチング</h3>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  あなたが選んだ顔タイプに紐づくキーワード（例：清楚系→「黒髪」「清楚」「スレンダー」など）をFANZAの作品タグ・説明文と照合し、マッチスコアを算出します。
                </p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  <h3 className="font-extrabold text-sm">フィードバック学習</h3>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  「いいね」「チェンジ」などのフィードバックを蓄積することで、あなた固有の好みのパターンをAIが学習。レコメンドが使うたびに最適化されます。
                </p>
              </div>
            </div>

            <p className="text-sm md:text-base">
              この2軸の組み合わせにより、「FANZAの公式レコメンド」とは異なる、あなた個人にカスタマイズされた作品リストが生成されます。
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
              <span className="text-primary">3.</span> 4ステップで始めるAIマッチング
            </h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{step.icon}</span>
                        <h3 className="font-extrabold text-sm md:text-base">{step.title}</h3>
                      </div>
                      <p className="text-sm text-foreground/70 leading-relaxed mb-3">{step.desc}</p>
                      <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                        <p className="text-xs text-primary font-bold">💡 コツ：{step.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">4.</span> フィードバック機能の使い方
            </h2>
            <p className="text-sm md:text-base mb-5">
              AIの精度を高めるために重要なのが、フィードバック機能です。3種類のアクションを使い分けることで、レコメンドが急速に改善されます。
            </p>
            <div className="space-y-3">
              {FEEDBACK_ITEMS.map((item) => (
                <div key={item.label} className={`flex items-start gap-4 border rounded-2xl p-4 ${item.color}`}>
                  <div className="p-2 bg-white/50 rounded-full flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm mb-1">{item.label}</p>
                    <p className="text-xs leading-relaxed opacity-80">{item.effect}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">5.</span> FANZAと組み合わせた活用術
            </h2>
            <p className="text-sm md:text-base mb-4">
              ドストライクAIのレコメンドを起点にFANZAを活用する、効率的な流れをご紹介します。
            </p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {[
                { num: "01", title: "AIレコメンドで気になる作品を「キープ」", desc: "まずドストライクAIで自分のタイプを登録し、マッチした作品を保存リストにためていきます。無料で何本でもキープ可能です。" },
                { num: "02", title: "保存リストをFANZAで確認", desc: "キープした作品の「視聴する」ボタンからFANZAの商品ページへ直接アクセス。レビューや出演者情報を詳しく確認できます。" },
                { num: "03", title: "FANZAのセール・キャンペーンを活用", desc: "FANZAでは定期的にポイント還元セールが実施されます。欲しい作品をリストに入れておき、セールのタイミングで購入するのがお得です。" },
                { num: "04", title: "フィードバックを続けてレコメンドを洗練", desc: "視聴した作品の感想をドストライクAIにフィードバックすることで、次回のレコメンドがさらにあなた好みに近づきます。" },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4 p-5 border-b border-border last:border-0">
                  <span className="text-3xl font-extrabold text-primary/20 flex-shrink-0 leading-none">{item.num}</span>
                  <div>
                    <h3 className="font-extrabold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-foreground/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">6.</span> まとめ
            </h2>
            <p className="text-sm md:text-base mb-4">
              ドストライクAIを使ったFANZA活用の流れをまとめると次の通りです。
            </p>
            <div className="bg-secondary/50 border border-border rounded-2xl p-5 space-y-2">
              {[
                "30タイプの顔タイプから「自分の好み」を言語化する",
                "AIがFANZAの数万本からマッチ度順に作品をピックアップ",
                "フィードバックでAIを育て、レコメンドを最適化し続ける",
                "保存リストを育てて、FANZAで好きなタイミングに視聴",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-sm md:text-base mt-4">
              「好みはあるけどうまく言えない」——そんな状態から抜け出すきっかけとして、ぜひドストライクAIをご活用ください。
            </p>
          </section>

        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-8 text-center">
          <p className="text-xs text-foreground/50 mb-1">さっそく試してみましょう</p>
          <h3 className="font-extrabold text-lg mb-2">顔タイプを選んでAIマッチングを体験</h3>
          <p className="text-xs text-foreground/60 mb-5">完全無料・登録不要で今すぐ使えます</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_20px_rgba(244,63,94,0.3)]"
          >
            AIマッチングを試す <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 関連記事 */}
        <div className="mt-10">
          <h3 className="font-extrabold text-sm text-foreground/60 mb-4">関連記事</h3>
          <Link href="/column/face-type-guide" className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌸</span>
              <div>
                <p className="font-bold text-sm group-hover:text-primary transition-colors">清楚系・ギャル系・クール系…FANZAで人気の女優タイプを30パターンで徹底分類</p>
                <p className="text-xs text-foreground/50 mt-0.5">顔タイプ解説 · 約8分</p>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto flex-shrink-0 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}
