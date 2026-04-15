import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "清楚系・ギャル系・クール系…FANZAで人気の女優タイプを30パターンで徹底分類 | ドストライクAI コラム",
  description:
    "人が「好み」と感じる顔には共通した特徴があります。ドストライクAIが採用する30の顔タイプを6グループで解説。自分の好みを言語化して、FANZAでの作品選びに役立てましょう。",
  alternates: { canonical: "https://dostrike-ai.vercel.app/column/face-type-guide" },
  openGraph: {
    url: "https://dostrike-ai.vercel.app/column/face-type-guide",
    title: "FANZAで人気の女優タイプを30パターンで徹底分類 | ドストライクAI",
    description: "清楚系・ギャル系・クール系など6グループ30タイプを徹底解説。自分の好みを言語化して作品探しに活かそう。",
  },
};

const GROUPS = [
  {
    emoji: "🌸",
    name: "清楚系",
    color: "bg-pink-50 border-pink-200",
    badgeColor: "bg-pink-100 text-pink-700",
    desc: "黒髪ロング・色白・スレンダーといった、いわゆる「清楚美人」タイプ。端正な顔立ちと上品な雰囲気が特徴で、FANZAにおいても根強い人気を誇るカテゴリです。ボブ・グラマー・眼鏡知的系などのバリエーションがあり、サブタイプによってかなり印象が変わります。",
    types: ["清楚・黒髪ロング", "清楚・黒髪ショート（ボブ）", "清楚・茶髪ロング", "清楚・グラマー", "清楚・眼鏡知的系"],
    fanza: "AV業界でも「清楚系」「お嬢様系」「制服もの」などのジャンルが常に上位にランクイン。色白・黒髪・スレンダーの組み合わせが特に検索数が多い傾向があります。",
  },
  {
    emoji: "💗",
    name: "キュート系",
    color: "bg-rose-50 border-rose-200",
    badgeColor: "bg-rose-100 text-rose-600",
    desc: "童顔・小顔・活発さが魅力のタイプ。「かわいい」という印象を与える顔立ちが特徴で、アイドル系・天然系・ぽっちゃり系などサブタイプも豊富。若々しい雰囲気が好みの方に刺さるグループです。",
    types: ["キュート・童顔ボブ", "キュート・ツインテール", "キュート・天然素朴系", "キュート・ぽっちゃり", "キュート・アイドル系"],
    fanza: "「素人系」「アイドル系」「天然娘」などのキーワードで検索される作品に多く登場するタイプ。素朴さや天然感が人気を集める要因となっています。",
  },
  {
    emoji: "💄",
    name: "お姉さん系",
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700",
    desc: "20代後半〜30代の落ち着いた色気が魅力のグループ。セクシー・エレガント・人妻・熟女系など、大人の余裕を感じさせるタイプが揃っています。FANZAでも「熟女・人妻」ジャンルは安定した需要があります。",
    types: ["お姉さん・セクシー黒髪", "お姉さん・エレガント", "お姉さん・茶髪ウェーブ", "お姉さん・キャリア系", "お姉さん・人妻系"],
    fanza: "「人妻」「熟女」「30代OL」といったカテゴリで常に人気上位。年齢を感じさせる落ち着いた色気は、一定数の根強いファンを持ちます。",
  },
  {
    emoji: "💅",
    name: "ギャル系",
    color: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-100 text-orange-600",
    desc: "派手さと活発さが魅力のグループ。金髪・日焼け・個性的なスタイルが特徴で、元気・情熱的な印象を与えます。ヤンキー系・サブカル系など個性派サブタイプも含まれます。",
    types: ["ギャル・金髪", "ギャル・茶髪グラマー", "ヤンキー・個性派", "サブカル・不思議系", "ギャル・金髪グラマー"],
    fanza: "ギャル系・ヤンキー系・コスプレ系ジャンルで人気。派手な外見と情熱的な演技スタイルを好む視聴者に支持されています。",
  },
  {
    emoji: "🖤",
    name: "クール系",
    color: "bg-slate-50 border-slate-200",
    badgeColor: "bg-slate-100 text-slate-600",
    desc: "知的でミステリアスな雰囲気が魅力のグループ。モデル体型・高身長・外国人風のハーフ系など、スタイリッシュさが際立つタイプ。「美しさ」重視の視聴者に人気です。",
    types: ["クール・黒髪ショート", "クール・モデル系", "クール・外国人風（ハーフ）", "クール・ミステリアス", "クール・大人モデル"],
    fanza: "「スレンダー」「高身長モデル」「外国人系」などのキーワードで検索する層に人気。独特の美しさと存在感が評価されています。",
  },
  {
    emoji: "🌿",
    name: "その他・個性派",
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-700",
    desc: "スポーティ・和風美人・褐色セクシー・ぽっちゃり熟女など、特定のニッチな好みに応えるグループ。上の5グループに当てはまらない個性的な美しさを持つタイプが集まっています。",
    types: ["スポーティ・健康的", "素朴系・自然体", "和風美人", "褐色セクシー", "ぽっちゃり熟女"],
    fanza: "「スポーツ系」「和装・着物」「褐色・日焼け」など個性的なジャンルで根強いファンが存在。自分のニッチな好みに気づく入口にもなります。",
  },
];

export default function FaceTypeGuidePage() {
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
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-pink-100 text-pink-700">顔タイプ解説</span>
            <div className="flex items-center gap-1 text-foreground/40 text-xs">
              <Clock className="w-3 h-3" /><span>約8分で読める</span>
            </div>
            <span className="text-foreground/30 text-xs">2026年4月15日</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug mb-4">
            清楚系・ギャル系・クール系…<br className="hidden md:block" />
            FANZAで人気の女優タイプを<br className="hidden md:block" />
            30パターンで徹底分類
          </h1>
          <p className="text-foreground/70 text-sm md:text-base leading-relaxed border-l-4 border-primary/30 pl-4">
            「好みはあるけど、うまく言葉にできない」——多くの人が感じるこの悩みは、実は「顔タイプ」を知ることで解消できます。本記事では、ドストライクAIが採用する30の顔タイプを6つのグループに整理し、それぞれの特徴とFANZAでの人気傾向を解説します。
          </p>
        </div>

        {/* 目次 */}
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 mb-10">
          <h2 className="font-extrabold text-sm mb-3 text-foreground/70">📋 この記事の目次</h2>
          <ol className="space-y-1.5">
            <li className="text-sm"><span className="text-primary font-bold mr-2">1.</span>なぜ「顔タイプ」を知ることが重要なのか</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">2.</span>6大グループ × 30タイプ 完全解説</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">3.</span>AIを使った自分の好み発見法</li>
            <li className="text-sm"><span className="text-primary font-bold mr-2">4.</span>まとめ</li>
          </ol>
        </div>

        <div className="prose-custom space-y-12 text-foreground/90 leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">1.</span> なぜ「顔タイプ」を知ることが重要なのか
            </h2>
            <p className="text-sm md:text-base mb-4">
              FANZAには毎日数百本もの新作が登録されます。その膨大なラインナップの中から「自分の好みの作品」を見つけるのは、検索だけではなかなか難しいのが現実です。
            </p>
            <p className="text-sm md:text-base mb-4">
              多くの場合、好みは「ジャンル」よりも「出演している女優のタイプ」によって左右されます。たとえば同じ「素人系」でも、童顔かお姉さん系かで印象はまったく異なります。
            </p>
            <p className="text-sm md:text-base mb-4">
              「顔タイプ」を言語化・分類することで、次のような効果があります。
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base pl-2">
              <li>自分の好みを第三者（AIを含む）に伝えられるようになる</li>
              <li>作品タイトルや検索キーワードのヒット率が上がる</li>
              <li>「なんとなく好き」から「明確に選べる」状態に変わる</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
              <span className="text-primary">2.</span> 6大グループ × 30タイプ 完全解説
            </h2>

            <div className="space-y-8">
              {GROUPS.map((group, i) => (
                <div key={i} className={`border rounded-2xl p-5 md:p-6 ${group.color}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{group.emoji}</span>
                    <div>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${group.badgeColor}`}>
                        グループ {String.fromCharCode(65 + i)}
                      </span>
                      <h3 className="text-lg font-extrabold mt-0.5">{group.name}</h3>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed mb-4 text-foreground/80">{group.desc}</p>

                  <div className="bg-white/60 rounded-xl p-3 mb-4">
                    <p className="text-xs font-bold text-foreground/60 mb-2">含まれるタイプ（5種）</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.types.map((type) => (
                        <span key={type} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${group.badgeColor}`}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/40 rounded-xl p-3">
                    <p className="text-xs font-extrabold text-foreground/60 mb-1">📊 FANZAでの傾向</p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{group.fanza}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">3.</span> AIを使った自分の好み発見法
            </h2>
            <p className="text-sm md:text-base mb-4">
              上の6グループ30タイプを見て「自分が好きなのはどれだろう？」と思い始めた方も多いでしょう。ただ、人の好みは一つのグループに収まらないことも多く、「清楚系も好きだけど、クール系も捨てがたい」という方は非常に多くいます。
            </p>
            <p className="text-sm md:text-base mb-4">
              そこで役立つのがドストライクAIの<strong>マルチスロット機能</strong>です。最大5つのタイプを同時に登録でき、それぞれのタイプに合ったFANZA作品をまとめてレコメンドします。
            </p>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              {[
                { step: "①", text: "ドストライクAIのダッシュボードを開く" },
                { step: "②", text: "「好きなタイプ」スロットから上の30タイプの中で気になるものを1〜5個選択" },
                { step: "③", text: "AIがFANZAのデータベースからマッチスコア順に作品をピックアップ" },
                { step: "④", text: "「キープ」「ドストライク」でフィードバックするとAIの精度が向上" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 mt-0.5">{step}</div>
                  <p className="text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <span className="text-primary">4.</span> まとめ
            </h2>
            <p className="text-sm md:text-base mb-4">
              FANZAで「ドストライク」な作品に出会うためには、まず自分の好みを言語化することが重要です。本記事で紹介した6グループ30タイプを参考に、ぜひご自身の「顔タイプ嗜好」を把握してみてください。
            </p>
            <p className="text-sm md:text-base mb-6">
              そして、言語化した好みをドストライクAIに登録することで、膨大なFANZA作品の中から自分に最もマッチした作品が自動でリストアップされます。毎日更新されるレコメンドで、新しいお気に入りを見つけましょう。
            </p>
          </section>

        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-8 text-center">
          <p className="text-xs text-foreground/50 mb-1">この記事を読んだら、実際に試してみましょう</p>
          <h3 className="font-extrabold text-lg mb-2">自分の顔タイプを登録して<br />ドストライク作品を見つける</h3>
          <p className="text-xs text-foreground/60 mb-5">完全無料・登録1分・FANZAの数万本からAIがマッチング</p>
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
          <Link href="/column/how-to-find" className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-bold text-sm group-hover:text-primary transition-colors">AIで「理想の作品」を見つける方法——顔タイプ診断からFANZA活用まで完全解説</p>
                <p className="text-xs text-foreground/50 mt-0.5">活用ガイド · 約6分</p>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto flex-shrink-0 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}
