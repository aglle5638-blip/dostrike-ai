"use client";

import { Crown, Sparkles, Play, Loader2, Plus, X, Video, ThumbsUp, ThumbsDown, Heart, TrendingUp, ChevronRight, Hash, Clock, Filter, ChevronDown, Search, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================
// 30パターン 顔系統カタログ定義
// ============================================================
export type FaceType = {
  id: string;
  group: string;
  groupColor: string;
  emoji: string;
  name: string;
  tags: string[];
  keywords: string[];
  imgId: string; // kept for legacy compat; actual image is /faces/{id}.jpg
};

export const TYPE_CATALOG: FaceType[] = [
  // ─── GROUP A: 清楚系 ───
  { id:'A1', group:'清楚系', groupColor:'bg-pink-100 text-pink-700', emoji:'🌸', name:'清楚・黒髪ロング',      tags:['色白','20代前半','スレンダー'],  keywords:['清楚系','黒髪','ロング','色白','スレンダー'],              imgId:'1517365830460-955ce3ccd263' },
  { id:'A2', group:'清楚系', groupColor:'bg-pink-100 text-pink-700', emoji:'🌸', name:'清楚・黒髪ショート',    tags:['色白','20代前半','ボブ'],        keywords:['清楚系','黒髪','ショート','色白'],                         imgId:'1508214751196-bcfd4ca60f91' },
  { id:'A3', group:'清楚系', groupColor:'bg-pink-100 text-pink-700', emoji:'🌸', name:'清楚・茶髪ロング',      tags:['色白','20代後半','上品'],        keywords:['清楚系','茶髪','ロング','上品'],                           imgId:'1544005313-94ddf0286df2' },
  { id:'A4', group:'清楚系', groupColor:'bg-pink-100 text-pink-700', emoji:'🌸', name:'清楚・グラマー',        tags:['色白','20代前半','豊満'],        keywords:['清楚系','巨乳','黒髪','色白'],                             imgId:'1531746020798-e6953c6e8e04' },
  { id:'A5', group:'清楚系', groupColor:'bg-pink-100 text-pink-700', emoji:'🌸', name:'清楚・眼鏡知的系',      tags:['色白','20代後半','知的'],        keywords:['清楚系','メガネ','知的','色白'],                           imgId:'1579782522718-d731855a9062' },
  // ─── GROUP B: キュート系 ───
  { id:'B1', group:'キュート系', groupColor:'bg-rose-100 text-rose-600', emoji:'💗', name:'キュート・童顔ボブ',    tags:['色白','10代後半〜20代','小顔'],   keywords:['かわいい','童顔','ボブ','色白','小顔'],                    imgId:'1562916172-8874bb7c1b7e' },
  { id:'B2', group:'キュート系', groupColor:'bg-rose-100 text-rose-600', emoji:'💗', name:'キュート・ツインテール', tags:['色白','20代前半','活発'],         keywords:['かわいい','ツインテール','元気','アイドル系'],              imgId:'1580489944761-15a19d654956' },
  { id:'B3', group:'キュート系', groupColor:'bg-rose-100 text-rose-600', emoji:'💗', name:'キュート・天然系',       tags:['健康的','20代前半','フレッシュ'], keywords:['天然','素朴','かわいい','フレッシュ','素人系'],             imgId:'1519781542700-1bfa3c675661' },
  { id:'B4', group:'キュート系', groupColor:'bg-rose-100 text-rose-600', emoji:'💗', name:'キュート・ぽっちゃり',   tags:['健康的','20代前半','癒し'],      keywords:['ぽっちゃり','かわいい','癒し系'],                          imgId:'1564887333-bcd2cde32ff9' },
  { id:'B5', group:'キュート系', groupColor:'bg-rose-100 text-rose-600', emoji:'💗', name:'キュート・アイドル系',   tags:['色白','10代後半','小柄'],        keywords:['アイドル系','かわいい','小顔','色白'],                     imgId:'1611042553365-9d10e42f9ae4' },
  // ─── GROUP C: お姉さん系 ───
  { id:'C1', group:'お姉さん系', groupColor:'bg-purple-100 text-purple-700', emoji:'💄', name:'お姉さん・セクシー黒髪',  tags:['色白','20代後半','グラマー'], keywords:['お姉さん系','セクシー','黒髪'],                            imgId:'1546961329-78bef0414d7c' },
  { id:'C2', group:'お姉さん系', groupColor:'bg-purple-100 text-purple-700', emoji:'💄', name:'お姉さん・エレガント',    tags:['色白','30代前半','上品'],     keywords:['熟女','エレガント','美人'],                                imgId:'1534528741775-53994a69daeb' },
  { id:'C3', group:'お姉さん系', groupColor:'bg-purple-100 text-purple-700', emoji:'💄', name:'お姉さん・茶髪ウェーブ',  tags:['健康的','20代後半','グラマー'],keywords:['お姉さん系','茶髪','グラマー','ウェーブ'],                  imgId:'1600486302931-b8e5f07f7088' },
  { id:'C4', group:'お姉さん系', groupColor:'bg-purple-100 text-purple-700', emoji:'💄', name:'お姉さん・キャリア系',    tags:['色白','30代前半','知的'],     keywords:['人妻','熟女','知的','スーツ'],                             imgId:'1573496359142-b8d87734a5a2' },
  { id:'C5', group:'お姉さん系', groupColor:'bg-purple-100 text-purple-700', emoji:'💄', name:'お姉さん・人妻系',        tags:['健康的','30代','家庭的'],     keywords:['人妻','熟女','30代'],                                      imgId:'1508214751196-bcfd4ca60f91' },
  // ─── GROUP D: ギャル系 ───
  { id:'D1', group:'ギャル系', groupColor:'bg-orange-100 text-orange-600', emoji:'💅', name:'ギャル・金髪',          tags:['日焼け','20代前半','活発'],   keywords:['ギャル','金髪','日焼け'],                                  imgId:'1529626455594-4ff0802cfb7e' },
  { id:'D2', group:'ギャル系', groupColor:'bg-orange-100 text-orange-600', emoji:'💅', name:'ギャル・茶髪グラマー',   tags:['健康的','20代前半','胸強調'], keywords:['ギャル','茶髪','スタイル抜群'],                            imgId:'1500917293891-ef795e70e1f6' },
  { id:'D3', group:'ギャル系', groupColor:'bg-orange-100 text-orange-600', emoji:'💅', name:'ヤンキー・個性派',       tags:['健康的','20代前半','個性的'], keywords:['ヤンキー系','個性的','ロング'],                            imgId:'1488426862026-3ee34a7d66fc' },
  { id:'D4', group:'ギャル系', groupColor:'bg-orange-100 text-orange-600', emoji:'💅', name:'サブカル・不思議系',     tags:['色白','20代前半','独特'],     keywords:['個性的','サブカル','色白'],                                imgId:'1525879000486-53846b4129d2' },
  { id:'D5', group:'ギャル系', groupColor:'bg-orange-100 text-orange-600', emoji:'💅', name:'ギャル・金髪グラマー',   tags:['日焼け','20代後半','豊満'],   keywords:['ギャル','グラマー','金髪'],                                imgId:'1520813792240-56fc4a3765a7' },
  // ─── GROUP E: クール系 ───
  { id:'E1', group:'クール系', groupColor:'bg-slate-100 text-slate-600', emoji:'🖤', name:'クール・黒髪ショート',   tags:['色白','20代後半','スレンダー'],keywords:['クール','黒髪','ショート','スレンダー'],                   imgId:'1555952517-2e8e729e0b44' },
  { id:'E2', group:'クール系', groupColor:'bg-slate-100 text-slate-600', emoji:'🖤', name:'クール・モデル系',       tags:['色白','20代後半','高身長'],   keywords:['モデル系','スレンダー','美人'],                            imgId:'1509967419530-da38b4704bc6' },
  { id:'E3', group:'クール系', groupColor:'bg-slate-100 text-slate-600', emoji:'🖤', name:'クール・外国人風',       tags:['白人系','20代前半','ハーフ'], keywords:['外国人','ハーフ','金髪'],                                  imgId:'1541823709867-1b206113eafd' },
  { id:'E4', group:'クール系', groupColor:'bg-slate-100 text-slate-600', emoji:'🖤', name:'クール・ミステリアス',   tags:['色白','20代後半','独特'],     keywords:['ミステリアス','クール','色白'],                            imgId:'1438761681033-6461ffad8d80' },
  { id:'E5', group:'クール系', groupColor:'bg-slate-100 text-slate-600', emoji:'🖤', name:'クール・大人モデル',     tags:['色白','30代','高身長'],       keywords:['モデル','30代','スレンダー'],                              imgId:'1515151525042-32b0a39775fb' },
  // ─── GROUP F: その他 ───
  { id:'F1', group:'その他', groupColor:'bg-green-100 text-green-700', emoji:'🌿', name:'スポーティ・健康的',     tags:['健康的','20代前半','活発'],   keywords:['スポーティ','健康的','日焼け'],                            imgId:'1494790108377-be9c29b29330' },
  { id:'F2', group:'その他', groupColor:'bg-green-100 text-green-700', emoji:'🌿', name:'素朴系・自然体',         tags:['健康的','20代前半','素朴'],   keywords:['素人系','素朴','かわいい'],                                imgId:'1524502397800-4b71ab2a8cb9' },
  { id:'F3', group:'その他', groupColor:'bg-green-100 text-green-700', emoji:'🌿', name:'和風美人',              tags:['色白','20代後半','和装似合う'],keywords:['和風','清楚','黒髪','色白'],                               imgId:'1528642474498-0afb5ac10811' },
  { id:'F4', group:'その他', groupColor:'bg-green-100 text-green-700', emoji:'🌿', name:'褐色セクシー',          tags:['褐色','20代後半','エキゾチック'],keywords:['褐色','セクシー','エキゾチック'],                         imgId:'1489424731084-a5d8b219a5bb' },
  { id:'F5', group:'その他', groupColor:'bg-green-100 text-green-700', emoji:'🌿', name:'ぽっちゃり熟女',        tags:['健康的','30代','包容力'],     keywords:['ぽっちゃり','熟女','30代'],                                imgId:'1517841905240-472988babdf9' },
];

// ビデオフィード用（トレンド・保存リストで使用）
const FEMALE_IMAGE_IDS = TYPE_CATALOG.map(t => t.imgId);

const AD_IMAGES = [
  "1515886657613-9f3515b0c78f", "1529139574466-a303027c1d8b", 
  "1560072810-1cffb09faf0f", "1534528741775-53994a69daeb", "1520813792240-56fc4a3765a7"
];

const AFFILIATE_ADS = [
  { platform: "FANZA", title: "FANZA限定: 最新AIマッチングセール 最大70%OFF！", label: "AD / PR", color: "bg-yellow-400 text-black", imgIndex: 0 },
  { platform: "FC2動画", title: "FC2 個人撮影・素人 売れ筋トップ50をチェック", label: "AD / FC2", color: "bg-pink-500 text-white", imgIndex: 1 },
  { platform: "MGS動画", title: "MGS 新規無料登録で500ptプレゼントキャンペーン", label: "AD / MGS", color: "bg-blue-600 text-white", imgIndex: 2 },
  { platform: "DLsite", title: "DLsite 同人・音声作品 週末限定80%オフ大セール", label: "AD / DLsite", color: "bg-green-500 text-white", imgIndex: 3 },
  { platform: "FANZA", title: "FANZAアワード2026 最新受賞作品を一挙大公開！", label: "AD / PR", color: "bg-yellow-400 text-black", imgIndex: 4 },
];

const MOCK_TITLES = [
  "【完全独占配信】画面越しでも伝わる圧倒的な透明感と破壊的なスタイルを持つ超・新人",
  "SNSで話題沸騰！誰もが振り返る天使のような笑顔とプロポーションに密着",
  "素人発掘プロジェクト・奇跡の逸材がついにカメラの前に登場する衝撃のデビュー",
  "誰もが憧れたあの同級生が、秘密のベールを脱ぐ大反響の120分スペシャル",
  "清楚系お嬢様の隠された一面を解き明かす、二人きりのプレミアム密室ドキュメント",
  "過去最高の予約数を記録！次世代へ語り継がれるトップレベルの原石を発見",
  "都会の喧騒から離れた秘密の温泉宿で、誰にも邪魔されない極上の甘い週末旅行",
  "現役JDのリアルなプライベート空間に完全密着。カメラが捉えた素顔の記録",
  "圧倒的ビジュアル。非の打ち所がないパーフェクトヒロインからの熱視線",
  "業界震撼の大型デビュー！容姿端麗な彼女の予測不能なギャップに溺れる"
];


const TRENDS = [
  { rank: 1, name: "清楚系グラビア", color: "text-primary bg-primary/10" },
  { rank: 2, name: "黒髪ショート", color: "text-primary bg-primary/10" },
  { rank: 3, name: "ぽっちゃり系", color: "text-primary bg-primary/10" },
  { rank: 4, name: "高身長モデル", color: "text-foreground/60 bg-secondary" },
  { rank: 5, name: "女子大生", color: "text-foreground/60 bg-secondary" },
  { rank: 6, name: "熟女・人妻", color: "text-foreground/60 bg-secondary" },
  { rank: 7, name: "スレンダー", color: "text-foreground/60 bg-secondary" },
  { rank: 8, name: "褐色肌", color: "text-foreground/60 bg-secondary" },
  { rank: 9, name: "コスプレ", color: "text-foreground/60 bg-secondary" },
  { rank: 10, name: "ギャル", color: "text-foreground/60 bg-secondary" }
];

const TAG_LIST = ['#お姉さん系', '#素人風', '#ギャル', '#JD風', '#色白', '#巨乳', '#美脚', '#童顔', '#メガネ', '#制服'];

// トレンドモード時は value が null の場合「総合トレンド」を表示
type ViewMode = { type: 'personal' } | { type: 'trend', value: string | null } | { type: 'keep' };

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Remove static isVip since we use useState for it now
  const queryMode = searchParams.get('mode');

  // Modes
  const [viewMode, setViewMode] = useState<ViewMode>({ 
    type: queryMode === 'trend' ? 'trend' : queryMode === 'keep' ? 'keep' : 'personal', 
    value: null 
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Sync bottom nav URL param changes with local state
  useEffect(() => {
    if (queryMode === 'trend') {
       setViewMode((prev) => prev.type === 'trend' ? prev : { type: 'trend', value: null });
    } else if (queryMode === 'keep') {
       setViewMode({ type: 'keep' });
    } else {
       setViewMode({ type: 'personal' });
    }
  }, [queryMode]);
  // カタログ選択スロット（最大5つ）
  const [typeSlots, setTypeSlots] = useState<(FaceType | null)[]>([null, null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0); // 現在AIマッチを表示しているスロット
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null); // モーダルで編集中のスロット番号
  const [catalogFilter, setCatalogFilter] = useState<string>('all');

  
  // Interstitial Ad & VIP State
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interstitialAdIndex, setInterstitialAdIndex] = useState(0);
  const [isVip, setIsVip] = useState(false); // VIP mock status
  const [interactionCount, setInteractionCount] = useState(0);

  // Feedback
  // The 'any' cast here prevents TS string compatibility bugs later
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("match");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [keepFilter, setKeepFilter] = useState<'all'|'keep'|'strike'>('all');

  // Undo Toast State
  type UndoToast = { seed: string; prevAction: string; message: string; timerId: ReturnType<typeof setTimeout> } | null;
  const [undoToast, setUndoToast] = useState<UndoToast>(null);

  // Keep History derived state
  const keptItems = Object.entries(feedback).filter(([_, action]) => action === 'keep').slice(0, 4);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SORT_OPTIONS = [
    { value: 'match', label: '⚡️ ドストライク順' },
    { value: 'rank', label: '🔥 売上ランキング順' },
    { value: 'date', label: '🆕 新着・配信開始日順' },
    { value: 'review', label: '⭐ レビュー最高評価順' },
    { value: 'price_asc', label: '💰 価格の安い順' },
    { value: 'price_desc', label: '💎 価格の高い順' },
  ];
  const selectedSortOption = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];

  const renderSortDropdown = () => (
    <div className="relative w-auto z-50">
      <button 
        onClick={() => setIsSortOpen(!isSortOpen)}
        className="flex items-center justify-between gap-1 md:gap-2 bg-card border border-border px-3 py-2 md:py-2.5 rounded-full shadow-sm text-[11px] md:text-sm font-bold text-foreground hover:bg-secondary transition-colors"
      >
        <div className="flex items-center">
          <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-foreground/50 mr-1.5" />
          <span className="whitespace-nowrap">{selectedSortOption.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-foreground/50 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
      </button>

      {isSortOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
          <div className="absolute left-auto right-0 top-full mt-2 w-[180px] md:w-60 bg-card border border-border rounded-xl md:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 py-1 md:py-2 animate-in fade-in slide-in-from-top-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                className={`w-full text-left px-4 py-2 md:py-2.5 text-[11px] md:text-sm font-bold hover:bg-secondary transition-colors flex items-center justify-between 
                  ${sortBy === option.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}
              >
                {option.label}
                {sortBy === option.value && <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const handleFeedback = (seedPath: string, action: 'strike'|'change'|'keep'|'') => {
    setFeedback(prev => ({...prev, [seedPath]: action}));
    
    // Interstitial Ad Logic trigger (4アクションごとに表示)
    if (!isVip) {
       setInteractionCount(prev => {
          const next = prev + 1;
          if (next >= 4) {
             setTimeout(() => {
                setInterstitialAdIndex(prevIdx => (prevIdx + 1) % AFFILIATE_ADS.length);
                setShowInterstitialAd(true);
             }, 400); // 押したあとのUI演出を見せて少し間を置いてポップアップ
             return 0; // reset
          }
          return next;
       });
    }
  };

  // 保存リスト画面専用：Undoトースト付きの解除ハンドラ
  const handleKeepRemove = (seed: string, prevAction: string) => {
    // 既存のトーストがあればタイマーをキャンセルして即コミット
    if (undoToast) {
      clearTimeout(undoToast.timerId);
      setFeedback(prev => ({ ...prev, [undoToast.seed]: '' }));
    }

    // 解除したことをUIに即反映（feedbackを''にするが、undoToastで追跡）
    const label = prevAction === 'keep' ? '💛 キープ' : '👍 ドストライク';
    const timerId = setTimeout(() => {
      // 5秒後：正式にfeedbackから削除
      setFeedback(prev => ({ ...prev, [seed]: '' }));
      setUndoToast(null);
    }, 5000);

    setFeedback(prev => ({ ...prev, [seed]: '__removed__' }));
    setUndoToast({ seed, prevAction, message: `${label}を解除しました`, timerId });
  };

  const handleUndo = () => {
    if (!undoToast) return;
    clearTimeout(undoToast.timerId);
    setFeedback(prev => ({ ...prev, [undoToast.seed]: undoToast.prevAction }));
    setUndoToast(null);
  };

  const handleTrendClick = (trendName: string | null) => {
    setViewMode({ type: 'trend', value: trendName });
  };

  // カタログモーダルを開く
  const handleOpenCatalog = (slotIndex: number) => {
    setEditingSlotIndex(slotIndex);
    setCatalogFilter('all');
    setShowCatalogModal(true);
  };

  // カタログからタイプを選択
  const handleTypeSelect = (type: FaceType) => {
    if (editingSlotIndex === null) return;
    // 同じタイプが別スロットにすでに登録済みなら何もしない
    if (typeSlots.some((s, i) => s?.id === type.id && i !== editingSlotIndex)) return;
    setTypeSlots(prev => {
      const next = [...prev];
      next[editingSlotIndex] = type;
      return next;
    });
    setActiveSlotIndex(editingSlotIndex);
    setShowCatalogModal(false);
    setEditingSlotIndex(null);
  };

  // スロットをクリア
  const handleClearSlot = (e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation();
    setTypeSlots(prev => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    if (activeSlotIndex === slotIndex) {
      const firstFilled = typeSlots.findIndex((s, i) => s !== null && i !== slotIndex);
      setActiveSlotIndex(Math.max(0, firstFilled));
    }
  };

  // カタログモーダルコンポーネント
  const CATALOG_GROUPS = ['all', '清楚系', 'キュート系', 'お姉さん系', 'ギャル系', 'クール系', 'その他'];
  const filteredCatalog = catalogFilter === 'all'
    ? TYPE_CATALOG
    : TYPE_CATALOG.filter(t => t.group === catalogFilter);

  const renderCatalogModal = () => (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatalogModal(false)} />
      <div className="relative w-full sm:max-w-2xl bg-card rounded-t-3xl sm:rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">好きなタイプを選択</h2>
            <p className="text-xs text-foreground/50 mt-0.5">スロット {(editingSlotIndex ?? 0) + 1}&thinsp;/&thinsp;5 に登録します</p>
          </div>
          <button onClick={() => setShowCatalogModal(false)} className="p-2 rounded-full bg-secondary hover:bg-border transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 px-4 py-3 overflow-x-auto no-scrollbar flex-shrink-0 border-b border-border/30">
          {CATALOG_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setCatalogFilter(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                catalogFilter === g
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-secondary text-foreground/60 hover:text-foreground'
              }`}
            >
              {g === 'all' ? '🌟 すべて' : g}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {filteredCatalog.map(type => {
              const isSelected = typeSlots.some(s => s?.id === type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                      : 'border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-card'
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/faces/${type.id}.jpg`}
                      alt={type.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-md">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-center leading-tight text-foreground line-clamp-2">{type.name}</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {type.tags.slice(0, 2).map(tag => (
                      <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${type.groupColor}`}>{tag}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );


  /**
   * モード1：パーソナルAI推し
   */
  const renderPersonalMode = () => {
    const activeType = typeSlots[activeSlotIndex] ?? null;
    const filledSlots = typeSlots.filter(Boolean).length;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* タイプ選択エリア */}
        <div className="flex flex-col bg-card border border-border p-3 md:p-4 rounded-2xl gap-3 shadow-md relative overflow-hidden mb-5">
          <div className="absolute top-0 right-0 p-24 bg-primary/5 blur-[100px] rounded-full -z-10" />
          <div className="z-10">
            <h2 className="text-base md:text-lg font-extrabold tracking-tight">あなたの好きなタイプ</h2>
            <p className="text-foreground/70 leading-snug text-[10px] md:text-xs mt-0.5">
              30パターンから好みのタイプを選ぶだけでOK。最大5つ登録できます。
            </p>
          </div>

          {/* 5 Slots — padding で X ボタン/拡大表示が絶対に見切れないよう余白確保 */}
          <div className="z-10 flex gap-3 items-end overflow-x-auto no-scrollbar pt-3 pb-2 px-1">
            {typeSlots.map((slot, i) => {
              const isActive = i === activeSlotIndex && slot !== null;
              /* アクティブスロットはサイズ自体を大きくする（transformは使わない） */
              const sizeClass = slot
                ? isActive
                  ? 'w-[72px] h-[72px] md:w-[84px] md:h-[84px]'
                  : 'w-12 h-12 md:w-14 md:h-14'
                : 'w-12 h-12 md:w-14 md:h-14';
              return (
                <div
                  key={i}
                  /* X ボタンが飛び出す分の余白を top/right に確保 */
                  className="snap-start relative flex-shrink-0 mt-1 mr-1 group"
                >
                  <div
                    onClick={() => slot ? setActiveSlotIndex(i) : handleOpenCatalog(i)}
                    className={`relative rounded-2xl cursor-pointer transition-all duration-300 border-2 overflow-hidden ${sizeClass} ${
                      slot
                        ? isActive
                          ? 'border-primary shadow-[0_0_16px_rgba(244,63,94,0.45)]'
                          : 'border-primary/30 opacity-75 hover:opacity-100 hover:border-primary/60'
                        : 'border-dashed border-border/50 bg-secondary/50 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {slot ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/faces/${slot.id}.jpg`}
                          alt={slot.name}
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                            <div className="bg-primary rounded-full p-0.5 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    )}
                  </div>
                  {/* X ボタン：overflow-hidden の外側に配置するので絶対に見切れない */}
                  {slot && (
                    <button
                      onClick={(e) => handleClearSlot(e, i)}
                      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-foreground text-background rounded-full shadow-md hover:bg-red-500 hover:text-white transition-colors z-20 md:opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {filledSlots > 0 && (
              <button
                onClick={() => {
                  const emptyIdx = typeSlots.findIndex(s => s === null);
                  handleOpenCatalog(emptyIdx >= 0 ? emptyIdx : 0);
                }}
                className="flex-shrink-0 self-center flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary px-2 py-1.5 rounded-full hover:bg-primary/10 transition-colors ml-1"
              >
                <Plus className="w-3 h-3" /> 変更
              </button>
            )}
          </div>

          {/* Active Type Info */}
          {activeType ? (
            <div className="z-10 flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50">
              <span className="text-lg">{activeType.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-foreground truncate">{activeType.name}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {activeType.keywords.slice(0, 4).map(k => (
                    <span key={k} className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">#{k}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleOpenCatalog(activeSlotIndex)}
                className="flex-shrink-0 text-[9px] font-bold text-foreground/50 hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
              >変更</button>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 transition-opacity duration-1000 min-h-[500px]">
          {!activeType ? (
            <div className="text-center p-12 bg-card border border-border rounded-3xl mt-4 shadow-sm">
               <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-foreground/80 mb-2">好きなタイプを登録してください</h3>
               <p className="text-foreground/60 text-sm">上のエリアから好みのタイプを選ぶと、AIがマッチした動画を表示します。</p>
               <button onClick={() => handleOpenCatalog(0)} className="mt-5 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors">
                 タイプを選ぶ →
               </button>
            </div>
          ) : (
            <div className="transition-opacity duration-500 opacity-100" key={activeSlotIndex}>

              <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm mb-5 flex flex-row items-center gap-3">
                 <div className="bg-primary p-2 md:p-3 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] flex-shrink-0 flex flex-col items-center justify-center gap-0.5">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    <span className="text-white font-extrabold text-[8px] md:text-[10px]">日替わり</span>
                 </div>
                 <div className="flex-1">
                    <h3 className="font-extrabold flex items-center text-foreground mb-0.5 text-xs md:text-sm">
                      📅 本日のおすすめ：厳選6本
                    </h3>
                    <p className="text-foreground/70 text-[10px] md:text-xs leading-tight font-medium">
                      AIがあなたの好みを学習し、数万本のデータベースから<strong className="text-primary font-bold">本日最もマッチした究極の6本に絞り込んで</strong>お届けします。
                    </p>
                 </div>
              </div>


              {renderFeedHeader(<><span className="bg-primary text-white w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-2 text-xs md:text-sm">{activeSlotIndex + 1}</span> <span className="text-base md:text-xl">AIマッチ結果</span></>)}

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-5 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const sortOffset = sortBy === 'match' ? 0 : sortBy === 'popular' ? 5 : sortBy === 'new' ? 10 : 15;
                  const seedBase = activeSlotIndex * 100;
                  const seed = String(seedBase + i + sortOffset + 400);
                  const imgId = FEMALE_IMAGE_IDS[(seedBase + i + sortOffset) % FEMALE_IMAGE_IDS.length];
                  const thumbUrl = `https://images.unsplash.com/photo-${imgId}?w=800&h=450&fit=crop&auto=format&q=80`;
                  const fb = feedback[seed];
                  if (fb === 'change') {
                    return (
                      <div key={i} className="aspect-video bg-secondary/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border/60 p-4 text-center animate-in zoom-in-95 duration-300">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <p className="text-foreground/70 text-xs font-bold">AIが除外・再学習しました</p>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                      <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${fb === 'keep' ? 'border-yellow-400/70' : fb === 'strike' ? 'border-primary/70' : ''}`}>
                        <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbUrl} alt={`Thumbnail ${i}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap w-[90%]">
                            <div className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center shadow-lg border border-white/10">
                              <Sparkles className="w-3 h-3 text-primary mr-1" />
                              <span className="text-white font-extrabold text-[10px] tracking-wide">{99 - (i * 2 + (seedBase % 10))}.{Math.floor(Math.random() * 9)}%</span>
                            </div>
                            {fb === 'keep' && <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/> キープ中</div>}
                            {fb === 'strike' && <div className="bg-primary text-white px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/> アリ！</div>}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                            <button className="flex items-center justify-center gap-2 bg-white text-black py-2.5 px-6 rounded-full text-sm font-bold shadow-xl hover:scale-105 transition-transform z-20 mx-auto">
                              <Play className="w-4 h-4 fill-current" /> サンプル再生
                            </button>
                          </div>
                        </div>
                        <div className="p-2.5 md:p-3 bg-secondary/10 flex flex-col border-t border-border/50">
                          <div className="font-bold text-[11px] md:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
                            {MOCK_TITLES[(seedBase + i) % MOCK_TITLES.length]}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 md:gap-2 justify-between items-center w-full px-0.5">
                        <button onClick={() => handleFeedback(seed, 'change')} className={`flex flex-shrink-0 items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${fb==='change' ? 'bg-red-500 text-white' : 'bg-secondary border border-border text-foreground/70 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                          <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button onClick={() => handleFeedback(seed, fb === 'keep' ? '' : 'keep')} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-2 md:px-4 rounded-full font-bold text-[9px] md:text-[10px] transition-all ${fb === 'keep' ? 'bg-yellow-400 text-black' : 'bg-secondary border border-border text-foreground/70 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'}`}>
                          <Heart className={`w-3 h-3 md:w-3 md:h-3 flex-shrink-0 ${fb === 'keep' ? 'fill-current' : ''}`} />
                          <span>キープ</span>
                        </button>
                        <button onClick={() => handleFeedback(seed, fb === 'strike' ? '' : 'strike')} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-[9px] md:text-[10px] transition-all shadow-sm ${fb==='strike' ? 'bg-primary text-white' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white'}`}>
                          <ThumbsUp className="w-3 h-3 md:w-3 md:h-3 flex-shrink-0" />
                          <span>ストライク</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * セクションヘッダー（タイトル＋ソートドロップダウン）
   */
  const renderFeedHeader = (title: React.ReactNode) => (
    <div className="flex flex-row items-center justify-between gap-2 md:gap-4 pb-2 md:pb-3 border-b border-border/50 relative z-30 mb-4">
      <h3 className="text-sm sm:text-base md:text-xl font-extrabold flex items-center text-foreground truncate max-w-[65%]">
        {title}
      </h3>
      <div className="flex-shrink-0 relative z-50">
        {renderSortDropdown()}
      </div>
    </div>
  );

  /**
   * スマホ専用：トレンド・タグの横スクロールバー
   */
  const renderMobileTrendsBar = () => (
    <div className="xl:hidden mb-4">
      {/* トレンド行 */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5 mb-1.5">
        <button
          onClick={() => setViewMode({ type: 'trend', value: null })}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${viewMode.type === 'trend' && !('value' in viewMode && viewMode.value) ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}
        >
          🔥 総合トレンド
        </button>
        {TRENDS.map((t) => (
          <button
            key={t.rank}
            onClick={() => setViewMode({ type: 'trend', value: t.name })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${viewMode.type === 'trend' && 'value' in viewMode && viewMode.value === t.name ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {/* タグ行 */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
        {TAG_LIST.map((tag) => (
          <button
            key={tag}
            onClick={() => setViewMode({ type: 'trend', value: tag })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${viewMode.type === 'trend' && 'value' in viewMode && viewMode.value === tag ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  /**
   * モバイル・タブレット専用：横スクロール広告・VIPスライダー
   * 圧迫感を出さないようやや小さめに調整したコンパクト版スライダー
   */
  const renderMobileAdSlider = () => (
    <div className="xl:hidden w-full mb-5 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold">Sponsored & Premium</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-2 w-full px-1">
         
         {/* VIP Upsell */}
         <Link href="/vip" className="snap-start flex-shrink-0 w-[200px] bg-gradient-to-br from-card to-primary/5 border border-primary/20 p-3 rounded-xl shadow-sm relative overflow-hidden group flex flex-col justify-center">
            <h3 className="font-extrabold text-sm mb-0.5 text-foreground flex items-center gap-1.5"><Crown className="w-4 h-4 text-yellow-500" /> ディープマッチ</h3>
            <p className="text-[10px] text-foreground/60 mb-2 line-clamp-1 leading-snug">VIPで無制限にAIが学習。</p>
            <div className="w-full py-1.5 bg-primary text-primary-foreground font-bold text-[11px] text-center rounded-md shadow-sm">VIP機能を試す</div>
         </Link>

         {/* Ads */}
         {AFFILIATE_ADS.map((ad, index) => {
            const adImgId = AD_IMAGES[ad.imgIndex % AD_IMAGES.length];
            return (
              <div key={index} className="snap-start flex-shrink-0 w-[180px] relative rounded-xl overflow-hidden aspect-[2/1] border border-border shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://images.unsplash.com/photo-${adImgId}?w=300&h=150&fit=crop&q=80`} alt="ad" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white z-10 flex flex-col items-start">
                  <span className={`${ad.color} px-1.5 py-0.5 rounded shadow-sm text-[9px] font-extrabold mb-1`}>{ad.label}</span>
                  <div className="font-bold text-[11px] line-clamp-1 leading-snug">{ad.title}</div>
                </div>
              </div>
            );
         })}
      </div>
    </div>
  );


  /**
   * モード2：トレンド・発見（20件の高密度カード）
   */
  const renderTrendMode = (trendValue: string | null) => {
    const title = trendValue ? `${trendValue} の人気動画` : "総合トレンドランキング";
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
        {renderMobileTrendsBar()}
        
        {/* 検索バー */}
        <div className="relative mb-5 max-w-2xl">
           <input type="text" placeholder="好みのキーワードで検索する" className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm shadow-black/5" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
           {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"><X className="w-4 h-4"/></button>}
        </div>

        {renderFeedHeader(<><TrendingUp className="w-6 h-6 text-primary mr-2 hidden sm:block" /> {title}</>)}
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 mt-6 pb-8">
          {Array.from({ length: 20 }).map((_, idx) => {
            const i = idx + 1;
            const sortOffset = sortBy === 'match' ? 0 : sortBy === 'popular' ? 5 : sortBy === 'new' ? 10 : 15;
            const seedBase = (trendValue?.length || 1) * 10;
            const seed = String(seedBase + i + sortOffset + 900);
            const imgId = FEMALE_IMAGE_IDS[(seedBase + i + sortOffset) % FEMALE_IMAGE_IDS.length];
            const thumbUrl = `https://images.unsplash.com/photo-${imgId}?w=500&h=500&fit=crop&auto=format&q=80`;
            const fb = feedback[seed];

            return (
              <div key={i} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${fb === 'keep' ? 'border-yellow-400/70 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : fb === 'strike' ? 'border-primary/70 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
                  <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl} alt={`Trend ${i}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded flex items-center shadow-sm text-[10px] font-bold whitespace-nowrap">
                         <Play className="w-2.5 h-2.5 mr-1" /> サンプル
                      </div>
                      {fb === 'strike' && <div className="bg-primary text-white px-2 py-0.5 rounded-lg flex items-center shadow-lg font-bold text-[10px] whitespace-nowrap"><ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> アリ！</div>}
                    </div>

                    {fb === 'keep' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-0.5 flex items-center rounded-lg shadow-lg font-bold text-[10px] whitespace-nowrap">
                        <Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> キープ中
                      </div>
                    )}
                    
                    {/* トレンド版のホバーアクション (再生ボタンのみ) */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="flex items-center justify-center gap-1.5 bg-white text-black py-1.5 px-4 rounded-full text-[11px] font-bold shadow-xl hover:scale-105 transition-transform">
                          <Play className="w-3 h-3 fill-current" /> 再生
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-2.5 md:p-3 bg-secondary/10 border-t border-border/50 flex flex-col justify-center">
                     <div className="font-bold text-[11px] md:text-sm line-clamp-2 leading-relaxed text-foreground/90">
                        <span className="text-primary mr-1 text-[10px] md:text-xs">[{trendValue || 'オススメ'}]</span>
                        {MOCK_TITLES[((seedBase + i) * 3) % MOCK_TITLES.length]}
                     </div>
                  </div>
                </div>

                <div className="flex gap-1 md:gap-2 w-full justify-between items-center px-0.5">
                    <button onClick={() => handleFeedback(seed, 'change')} className={`flex flex-shrink-0 items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${fb==='change' ? 'bg-red-500 text-white shadow-md' : 'bg-secondary border border-border text-foreground/70 hover:bg-red-500 hover:text-white hover:border-red-500'}`} title="好みじゃない">
                        <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleFeedback(seed, fb === 'keep' ? '' : 'keep')} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-2 md:px-4 rounded-full font-bold text-[9px] md:text-[10px] transition-all shadow-sm ${fb === 'keep' ? 'bg-yellow-400 text-black' : 'bg-secondary border border-border text-foreground/80 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'}`}>
                        <Heart className={`w-3 h-3 md:w-3 md:h-3 flex-shrink-0 ${fb === 'keep' ? 'fill-current' : ''}`} />
                        <span>キープ</span>
                    </button>
                    <button onClick={() => handleFeedback(seed, fb === 'strike' ? '' : 'strike')} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-[9px] md:text-[10px] transition-all shadow-sm ${fb==='strike' ? 'bg-primary text-white shadow-md' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white'}`} title="ドストライク！">
                        <ThumbsUp className="w-3 h-3 md:w-3 md:h-3 flex-shrink-0" />
                        <span>ストライク</span>
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * モード3：最近のキープ（💛一覧画面）
   */
  const renderKeepMode = () => {
    const keepEntries = Object.entries(feedback).filter(([_, action]) => {
         if (keepFilter === 'all') return (action === 'keep' || action === 'strike');
         return action === keepFilter;
    });
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
         {renderFeedHeader(<><Heart className="w-4 h-4 md:w-6 md:h-6 text-yellow-400 fill-yellow-400 flex-shrink-0 mr-1.5" /> <span className="truncate">保存リスト</span></>)}
         
         <p className="text-foreground/70 leading-snug text-[10px] md:text-sm mt-3 hidden sm:block">
           動画で「キープ」または「ドストライク！」を押した動画の一覧が表示されます。
         </p>
         
         <div className="flex mt-4 mb-5">
            <div className="flex bg-secondary p-1 rounded-full border border-border w-full sm:w-auto overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setKeepFilter('all')} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${keepFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
              >
                すべて
              </button>
              <button 
                onClick={() => setKeepFilter('keep')} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${keepFilter === 'keep' ? 'bg-yellow-400 shadow-sm text-black' : 'text-foreground/50 hover:text-foreground'}`}
              >
                💛 キープ
              </button>
              <button 
                onClick={() => setKeepFilter('strike')} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${keepFilter === 'strike' ? 'bg-primary shadow-sm text-white' : 'text-foreground/50 hover:text-foreground'}`}
              >
                👍 ドストライク
              </button>
            </div>
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {keepEntries.length === 0 ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                     <Heart className="w-8 h-8 text-foreground/20 stroke-2" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-1">まだ保存されていません</h3>
                  <p className="text-xs text-foreground/50 font-medium">選抜やトレンドモードから気になる作品に💛や👍をつけましょう</p>
               </div>
            ) : (
               keepEntries.map(([seed, action]) => {
                  const numSeed = parseInt(seed, 10) || 0;
                  const imgId = FEMALE_IMAGE_IDS[numSeed % FEMALE_IMAGE_IDS.length];
                  return (
                    <div key={seed} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                      <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${action === 'keep' ? 'border-yellow-400/70 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : action === 'strike' ? 'border-primary/70 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
                        <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://images.unsplash.com/photo-${imgId}?w=400&h=500&fit=crop`} alt="kept" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded flex items-center shadow-sm text-[10px] font-bold whitespace-nowrap">
                                <Play className="w-2.5 h-2.5 mr-1" /> サンプル
                            </div>
                            {action === 'strike' && <div className="bg-primary text-white px-2 py-0.5 rounded-lg flex items-center shadow-lg font-bold text-[10px] whitespace-nowrap"><ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> アリ！</div>}
                          </div>

                          {action === 'keep' && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-0.5 flex items-center rounded-lg shadow-lg font-bold text-[10px] whitespace-nowrap">
                              <Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> キープ中
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="flex items-center justify-center gap-1.5 bg-white text-black py-1.5 px-4 rounded-full text-[11px] font-bold shadow-xl hover:scale-105 transition-transform">
                                <Play className="w-3 h-3 fill-current" /> 再生
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 md:p-3 bg-secondary/10 border-t border-border/50 flex flex-col justify-center">
                           <div className="font-bold text-[11px] md:text-sm line-clamp-2 leading-relaxed text-foreground/90">
                              <span className="text-primary mr-1 text-[10px] md:text-xs">[{action === 'strike' ? '👍ドストライク' : '💛キープ'}]</span>
                              {MOCK_TITLES[(numSeed * 5) % MOCK_TITLES.length]}
                           </div>
                        </div>
                      </div>

                      <div className="flex gap-1 md:gap-2 w-full justify-between items-center px-0.5">
                          <button
                            onClick={() => handleKeepRemove(seed, action)}
                            className="flex flex-shrink-0 items-center justify-center gap-1 px-2 h-8 md:h-9 rounded-full transition-all bg-secondary border border-border text-foreground/60 hover:bg-red-500 hover:text-white hover:border-red-500 text-[9px] md:text-[10px] font-bold whitespace-nowrap"
                            title="解除する"
                          >
                            <X className="w-3 h-3 flex-shrink-0" />
                            <span>解除</span>
                          </button>
                          <div className={`flex flex-1 items-center justify-center gap-1 py-1.5 rounded-full font-bold text-[9px] md:text-xs ${action === 'keep' ? 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/30' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                            {action === 'keep'
                              ? <><Heart className="w-3 h-3 fill-current flex-shrink-0" /><span>キープ中</span></>
                              : <><ThumbsUp className="w-3 h-3 fill-current flex-shrink-0" /><span>ドストライク中</span></>}
                          </div>
                      </div>
                    </div>
                  );
               })
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 共通のグローバルヘッダー */}
      <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm flex items-center justify-between px-4 md:px-8 py-3 h-14">
        {/* モバイルでタイトルを中央にするための見えないスペーサー */}
        <div className="w-8 h-8 sm:hidden" />
        
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
          <div className="bg-primary p-1 md:p-1.5 rounded-lg">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">ドストライク<span className="text-primary">AI</span></span>
        </Link>
        
        <div className="hidden sm:flex items-center gap-3 w-auto justify-end">
          <Link href="/guide" className="text-xs font-bold text-foreground/70 hover:text-foreground">ご利用ガイド</Link>
          <Link href="/vip" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold transition-colors">
            VIP登録
          </Link>
          <Link href="/mypage" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border transition-colors hover:border-primary">M</Link>
        </div>
        
        {/* モバイル用 右上ガイドアイコン */}
        <div className="sm:hidden flex items-center justify-end w-8 h-8">
           <Link href="/guide" className="flex items-center justify-center text-foreground/50 hover:text-foreground">
             <BookOpen className="w-5 h-5" />
           </Link>
        </div>
      </header>

      <div className="flex-1 w-full px-3 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10 grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-8 ease-out">
        
        {/* =======================
            左カラム: トレンド & タグ 
        ======================== */}
        <div className="hidden xl:block xl:col-span-3">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-6 pb-20">
            
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold flex items-center gap-2 mb-4 text-foreground">
                <TrendingUp className="w-5 h-5 text-primary" /> 探す・見つける
              </h3>
              <div className="space-y-1 mt-4">
                <button 
                  onClick={() => handleTrendClick(null)} 
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-[13px] transition-colors border ${viewMode.type === 'trend' && !viewMode.value ? 'bg-primary text-white border-primary shadow-md' : 'border-transparent text-foreground hover:bg-secondary'}`}
                >
                  <TrendingUp className="w-4 h-4" /> 総合トレンド
                </button>
                <div className="my-2 border-t border-border w-1/2 mx-auto" />
                {TRENDS.map((t) => (
                  <div key={t.rank} onClick={() => handleTrendClick(t.name)} className={`flex items-center gap-3 p-2 rounded-xl group cursor-pointer transition-colors border ${viewMode.type === 'trend' && viewMode.value === t.name ? 'bg-foreground text-background border-foreground shadow-sm' : 'border-transparent hover:bg-secondary/50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                      {t.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[13px] group-hover:text-primary transition-colors line-clamp-1">{t.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-border group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold flex items-center gap-2 mb-4 text-foreground">
                <Hash className="w-5 h-5 text-accent" /> 発見タグ
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAG_LIST.map((tag, i) => (
                  <span key={i} onClick={() => handleTrendClick(tag)} className={`cursor-pointer px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors border ${viewMode.type === 'trend' && viewMode.value === tag ? 'bg-foreground text-background border-foreground' : 'bg-secondary text-foreground/80 hover:bg-border border-border/40'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            中央メイン: ユーザー設定＆動画一覧 
        ======================== */}
        <div className="xl:col-span-6 min-w-0 flex flex-col">
          
          {/* 最上位ナビゲーションタブ (PC/タブレット用) */}
          <div className="hidden sm:flex bg-card border border-border p-1.5 rounded-[2rem] items-center mb-6 shadow-sm overflow-hidden z-20">
            <button 
              onClick={() => setViewMode({ type: 'personal' })} 
              className={`flex-1 py-3 text-sm md:text-base font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'personal' ? 'bg-primary text-white shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <Sparkles className="w-4 h-4" /> 🎯 ドストライク選抜
            </button>
            <button 
              onClick={() => setViewMode({ type: 'trend', value: 'value' in viewMode ? viewMode.value : null })} 
              className={`flex-1 py-3 text-sm md:text-base font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'trend' ? 'bg-foreground text-background shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <TrendingUp className="w-4 h-4" /> 🔥 トレンド・発見
            </button>
            <button 
              onClick={() => setViewMode({ type: 'keep' })} 
              className={`flex-1 py-3 text-sm md:text-base font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'keep' ? 'bg-yellow-400 text-black shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <Heart className="w-4 h-4" /> 💛 保存リスト
            </button>
          </div>

          {/* モバイル版のみ、インフィード広告スライダーを表示 */}
          {renderMobileAdSlider()}

          <div className="flex-1 w-full min-h-[600px] relative">
            {viewMode.type === 'personal' ? renderPersonalMode() : viewMode.type === 'trend' ? renderTrendMode(viewMode.value) : renderKeepMode()}
          </div>
        </div>

        {/* =======================
            右カラム: マネタイズ枠
        ======================== */}
        <div className="hidden xl:block xl:col-span-3">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-6 pb-20">
            
            <div className="bg-gradient-to-br from-card to-primary/5 border border-primary/20 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors cursor-pointer">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-28 h-28 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors" />
              <Crown className="w-8 h-8 text-yellow-500 mb-4" />
              <h3 className="font-extrabold text-lg mb-2 text-foreground">より深いディープマッチ</h3>
              <p className="text-xs text-foreground/60 mb-6 leading-relaxed font-medium">VIPプランなら無制限にAIが学習。世界トップクラスの精度であなたの本当の性癖・好みを抽出します。</p>
              <Link href="/vip" className="block text-center w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-[0_4px_14px_0_rgba(244,63,94,0.39)]">
                VIP機能を3日間試す
              </Link>
            </div>

            <div className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold pt-2 mb-3">Sponsored</div>
            
            {[...AFFILIATE_ADS].map((ad, index) => {
               const adImgId = AD_IMAGES[ad.imgIndex % AD_IMAGES.length];
               const isWide = index % 2 === 0;

               return (
                 <div key={index} className={`bg-card rounded-3xl flex items-center justify-center border border-border/50 overflow-hidden relative group cursor-pointer shadow-sm ${isWide ? 'aspect-[5/3]' : 'aspect-square'}`}>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={`https://images.unsplash.com/photo-${adImgId}?w=400&h=400&fit=crop&q=80`} alt={`Ad ${index}`} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                   <div className="absolute bottom-5 left-5 right-5 text-white z-10">
                      <span className={`${ad.color} px-2 py-0.5 rounded shadow-sm text-[10px] font-extrabold mb-2.5 inline-block`}>{ad.label}</span>
                      <div className="font-bold text-sm line-clamp-2 leading-snug">{ad.title}</div>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>

      </div>

      {/* Interstitial Ad Popup */}
      {showInterstitialAd && !isVip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-5 sm:px-0 animate-in fade-in duration-300">
          <div className="relative w-full max-w-[340px] bg-card rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col zoom-in-95 animate-in duration-300">
            {/* 非常に大きな×ボタン */}
            <button 
              onClick={() => setShowInterstitialAd(false)} 
              className="absolute top-3 right-3 z-20 w-11 h-11 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              aria-label="広告を閉じる"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
            
            <div className="p-3 bg-gradient-to-br from-primary/10 to-transparent border-b border-border/50 text-center">
              <span className="bg-yellow-400 text-black px-2 py-0.5 rounded shadow-sm text-[10px] font-extrabold tracking-widest uppercase">Sponsored / PR</span>
            </div>
            
            <div className="p-5 flex flex-col items-center text-center space-y-4">
              <img 
                src={`https://images.unsplash.com/photo-${AD_IMAGES[AFFILIATE_ADS[interstitialAdIndex].imgIndex % AD_IMAGES.length]}?w=600&h=400&fit=crop&q=80`} 
                alt="ad" 
                className="w-full rounded-2xl aspect-[4/3] object-cover mb-1 shadow-sm" 
              />
              
              <h3 className="text-lg font-extrabold leading-tight">
                {AFFILIATE_ADS[interstitialAdIndex].title}
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed font-bold px-2">
                ユーザー様向けに特別に厳選されたキャンペーン広告です。今すぐチェック！
              </p>
              
              <button 
                onClick={() => setShowInterstitialAd(false)} 
                className={`w-full mt-2 py-3.5 ${AFFILIATE_ADS[interstitialAdIndex].color} hover:opacity-90 rounded-xl font-extrabold flex items-center justify-center shadow-md transition-all text-sm`}
              >
                キャンペーンを見る
              </button>
            </div>
            
            <div className="p-4 bg-secondary/30 text-center border-t border-border/50">
               <Link href="/vip" className="text-xs font-extrabold text-foreground/50 hover:text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors">
                 VIP登録してこの広告を非表示にする
               </Link>
            </div>
          </div>
        </div>
      )}
      {/* ============ Undo Toast ============ */}
      {undoToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-foreground text-background pl-4 pr-3 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-foreground/20 min-w-[260px] max-w-[90vw]">
            <span className="text-xs font-bold flex-1 whitespace-nowrap">{undoToast.message}</span>
            <button
              onClick={handleUndo}
              className="flex-shrink-0 bg-background text-foreground hover:bg-background/80 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors border border-foreground/10"
            >
              元に戻す
            </button>
            <button
              onClick={() => {
                clearTimeout(undoToast.timerId);
                setFeedback(prev => ({ ...prev, [undoToast.seed]: '' }));
                setUndoToast(null);
              }}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* カタログモーダル */}
      {showCatalogModal && renderCatalogModal()}

    </div>
  );
}
