import Link from "next/link";
import { Crown, CheckCircle2, ChevronRight, Play, Star, Settings2, ImagePlus, EyeOff, Infinity, ArrowLeft } from "lucide-react";

export default function VipPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="hidden sm:flex w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground font-extrabold text-lg hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" /> ホームに戻る
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-16">
        
        {/* FV */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
            <Crown className="w-12 h-12 text-yellow-500 z-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            妥協なき、<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">至高のディープマッチ体験を。</span>
          </h1>
          <p className="text-foreground/70 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            VIPプランに参加すると、ドストライクAIの全機能が解放されます。<br className="hidden md:block" />システム制限を取り払い、最高の視聴環境をご提供いたします。
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 px-4 md:px-0">
          {[
            { icon: ImagePlus, title: "AI学習枠を最大5枠へ拡張", desc: "無料プランの1枠制限を解除。好きな顔のタイプを最大5人まで同時に登録し、幅広い傾向のレコメンドを受け取ることができます。" },
            { icon: EyeOff, title: "純広告の完全非表示", desc: "一覧画面やサイドバー等に表示されるPR広告枠を非表示にします。クリーンで洗練された最高のUI体験をお約束します。" },
            { icon: Infinity, title: "キープ動画の無制限保存", desc: "無料プランでは上限のあるキープ(💛)機能が、無制限に解放されます。お気に入りライブラリをいくらでもストック可能です。" },
            { icon: Settings2, title: "高度なソート・検索機能", desc: "「話題の新作順」「レビュー高評価順」など、トレンド画面で目的の動画に素早く到達するための全ソート機能が解放されます。" }
          ].map((b, i) => (
            <div key={i} className="bg-gradient-to-br from-card to-card hover:from-yellow-500/5 hover:to-card border border-border p-6 rounded-3xl transition-colors shadow-sm group">
              <b.icon className="w-8 h-8 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-extrabold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto px-4 md:px-0 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-yellow-500/5 blur-[120px] rounded-full -z-10" />
          
          <div className="bg-card border border-border p-8 rounded-3xl shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">1ヶ月プラン</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold">¥2,480</span>
                <span className="text-foreground/50 pb-1">/月</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['全てのVIP機能が利用可能', '1ヶ月ごとの自動更新', 'いつでも解約可能'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full py-4 rounded-xl border-2 border-border text-foreground font-bold hover:bg-secondary transition-colors">
              月額プランを選択
            </button>
          </div>

          <div className="bg-gradient-to-b from-yellow-500/10 to-card border-2 border-yellow-500 p-8 rounded-3xl shadow-xl flex flex-col justify-between relative transform md:scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-extrabold tracking-wide">
              人気No.1 / 約3ヶ月分お得
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">年間プラン</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold">¥22,800</span>
                <span className="text-foreground/50 pb-1">/年</span>
              </div>
              <div className="text-sm font-bold text-yellow-600 mb-6 border border-yellow-500/30 bg-yellow-500/10 w-fit px-2 py-0.5 rounded">
                実質 ¥1,900/月
              </div>
              <ul className="space-y-4 mb-8">
                {['全てのVIP機能が利用可能', '年間約9,000円のお値引き', 'いつでも解約可能'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/90">
                    <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full py-4 rounded-xl bg-yellow-500 text-black font-extrabold hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2">
              年間プランを選択 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
