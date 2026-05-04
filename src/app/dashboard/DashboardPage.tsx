"use client";

import { Crown, Sparkles, Play, Loader2, Plus, X, Video, ThumbsUp, ThumbsDown, Heart, TrendingUp, ChevronRight, Hash, Clock, Filter, ChevronDown, Search, BookOpen, Star, Users, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { VideoResult, RecommendResponse, SortBy } from "@/lib/fanza/types";
import { useAuth } from "@/components/AuthProvider";
import SwipeOnboarding from "@/components/SwipeOnboarding";

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
  {
    platform: "FANZA",
    title: "FANZA 売上ランキング TOP100を見る",
    label: "AD / PR",
    color: "bg-yellow-400 text-black",
    imgIndex: 0,
    url: "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Flist%2F%3D%2Fsort%3Dranking%2F&af_id=dostrikeai-990&ch=side_ranking",
  },
  {
    platform: "FANZA",
    title: "FANZA 新着・本日発売の注目作品",
    label: "AD / PR",
    color: "bg-pink-500 text-white",
    imgIndex: 1,
    url: "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Flist%2F%3D%2Fsort%3Ddate%2F&af_id=dostrikeai-990&ch=side_new",
  },
  {
    platform: "FANZA",
    title: "FANZA 高評価レビュー作品まとめ",
    label: "AD / PR",
    color: "bg-yellow-400 text-black",
    imgIndex: 2,
    url: "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Flist%2F%3D%2Fsort%3Dreview%2F&af_id=dostrikeai-990&ch=side_review",
  },
  {
    platform: "FANZA",
    title: "FANZA月額見放題プランをチェック！",
    label: "AD / PR",
    color: "bg-blue-600 text-white",
    imgIndex: 3,
    url: "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Flist%2F%3D%2Fsort%3Dranking%2F&af_id=dostrikeai-990&ch=side_monthly",
  },
  {
    platform: "FANZA",
    title: "FANZAアワード2026 受賞作品を見る",
    label: "AD / PR",
    color: "bg-yellow-400 text-black",
    imgIndex: 4,
    url: "https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Flist%2F%3D%2Fsort%3Dranking%2F&af_id=dostrikeai-990&ch=side_award",
  },
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


// トレンド名/タグ → 顔タイプIDマッピング（FANZA APIのkeywordsに対応）
const TREND_TO_TYPE_IDS: Record<string, string[]> = {
  '清楚系グラビア': ['A1', 'A2', 'A3'],
  '黒髪ショート':   ['A2', 'E1'],
  'ぽっちゃり系':   ['B4', 'F5'],
  '高身長モデル':   ['E2', 'E5'],
  '女子大生':       ['B1', 'B2', 'B3'],
  '熟女・人妻':     ['C4', 'C5'],
  'スレンダー':     ['A1', 'E1', 'E2'],
  '褐色肌':         ['F4'],
  'コスプレ':       ['B2', 'D4'],
  'ギャル':         ['D1', 'D2', 'D5'],
  '#お姉さん系':    ['C1', 'C2', 'C3'],
  '#素人風':        ['B3', 'F2'],
  '#ギャル':        ['D1', 'D2', 'D5'],
  '#JD風':          ['B1', 'B2', 'B5'],
  '#色白':          ['A1', 'A2', 'E1'],
  '#巨乳':          ['A4', 'D2'],
  '#美脚':          ['E2', 'E5'],
  '#童顔':          ['B1', 'B4'],
  '#メガネ':        ['A5', 'C4'],
  '#制服':          ['B5', 'B2'],
};
const TREND_FALLBACK_IDS = ['A1', 'B1', 'C1', 'D1', 'E1']; // 総合トレンド用

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

const TAG_LIST = [
  { label: '#お姉さん系', keyword: 'お姉さん系' },
  { label: '#素人風', keyword: '素人' },
  { label: '#ギャル', keyword: 'ギャル' },
  { label: '#JD風', keyword: '女子大生' },
  { label: '#色白', keyword: '色白' },
  { label: '#巨乳', keyword: '巨乳' },
  { label: '#美脚', keyword: '美脚' },
  { label: '#童顔', keyword: '童顔' },
  { label: '#メガネ', keyword: 'メガネ' },
  { label: '#制服', keyword: '制服' },
  { label: '#ぽっちゃり', keyword: 'ぽっちゃり' },
];

// トレンドモード時は value が null の場合「総合トレンド」を表示
type ViewMode = { type: 'personal' } | { type: 'trend', value: string | null } | { type: 'keep' };

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading: isAuthLoading } = useAuth();
  const queryMode = searchParams.get('mode');

  // スワイプオンボーディング（好み未設定ユーザーに表示）
  const [showSwipeOnboarding, setShowSwipeOnboarding] = useState(false);
  const [hasCheckedPreferences, setHasCheckedPreferences] = useState(false);
  // スワイプ済み女優数（null = 未取得）
  const [preferenceCount, setPreferenceCount] = useState<number | null>(null);
  // 好み分析結果
  type PreferenceAnalysis = {
    count: number;
    topActresses: { actress_id: string; actress_name: string; image_url: string | null; tags: string[]; score: number }[];
    analysisText: string;
    characteristics: string[];
  };
  const [preferenceAnalysis, setPreferenceAnalysis] = useState<PreferenceAnalysis | null>(null);
  // パーソナライズ動画（Route 0: user_actress_preferences）
  const [personalVideos, setPersonalVideos] = useState<VideoResult[]>([]);
  const [isLoadingPersonalVideos, setIsLoadingPersonalVideos] = useState(false);
  // スワイプ完了後の動画リフレッシュトリガー
  const [personalRefreshKey, setPersonalRefreshKey] = useState(0);

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
  const [isSlotsLoading, setIsSlotsLoading] = useState(false); // DBからスロット復元中
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [previewFace, setPreviewFace] = useState<FaceType | null>(null);
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
  // 動画メタデータキャッシュ（保存リスト表示用）
  const [videoMeta, setVideoMeta] = useState<Record<string, VideoResult>>({});
  // ドストライクAIコミュニティ統計（全ユーザーの集計）
  type VideoStat = { keepCount: number; strikeCount: number; total: number };
  const [videoStats, setVideoStats] = useState<Record<string, VideoStat>>({});
  const [trendVideos, setTrendVideos] = useState<VideoResult[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendPage, setTrendPage] = useState(0); // 0始まり、20件/ページ、最大5ページ
  const [sortBy, setSortBy] = useState<SortBy>("match");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // API-fetched video recommendations
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // 広告スロット用：FANZAランキング上位動画のサムネイルを使用（グリッド2枠＋右パネル5枠）
  const [adVideos, setAdVideos] = useState<VideoResult[]>([]);
  useEffect(() => {
    fetch('/api/videos/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotTypeIds: ['A1', 'B1', 'C1', 'D1', 'E1'], sortBy: 'rank', limit: 7, skipActressMatch: true }),
    })
      .then(r => r.json())
      .then((data: RecommendResponse) => { if (data.videos?.length) setAdVideos(data.videos.slice(0, 7)); })
      .catch(() => {/* 失敗時は表示なし */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /api/videos/recommend フェッチ（アクティブスロットの顔タイプ変更 or ソート変更時）
  useEffect(() => {
    // アクティブスロットの顔タイプIDのみ送信（スロットごとに独立した女優マッチ結果を表示）
    const activeType = typeSlots[activeSlotIndex];
    if (!activeType) {
      setVideos([]);
      return;
    }
    let cancelled = false;
    setIsLoadingVideos(true);
    setVideoError(null);
    fetch('/api/videos/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotTypeIds: [activeType.id], sortBy, limit: 6 }),
    })
      .then(r => r.json())
      .then((data: RecommendResponse) => {
        if (!cancelled) {
          setVideos(data.videos ?? []);
          setIsLoadingVideos(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideoError('推薦の取得に失敗しました。しばらく待ってから再試行してください。');
          setIsLoadingVideos(false);
        }
      });
    return () => { cancelled = true; };
  }, [typeSlots, activeSlotIndex, sortBy]);
  const [keepFilter, setKeepFilter] = useState<'all'|'keep'|'strike'>('all');

  // Undo Toast State
  type UndoToast = { seed: string; prevAction: string; message: string; timerId: ReturnType<typeof setTimeout> } | null;
  const [undoToast, setUndoToast] = useState<UndoToast>(null);

  // Keep History derived state
  const keptItems = Object.entries(feedback).filter(([_, action]) => action === 'keep').slice(0, 4);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SORT_OPTIONS = [
    { value: 'match', label: '⚡️ いいね順' },
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
                onClick={() => { setSortBy(option.value as SortBy); setIsSortOpen(false); }}
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

  // ── ログイン時にDBからfeedbackを読み込む ─────────────────────────
  const loadFeedbackFromDB = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/videos/feedback', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.feedback && typeof data.feedback === 'object') {
        setFeedback(prev => ({ ...prev, ...data.feedback }));
      }
      if (data.videoMeta && typeof data.videoMeta === 'object') {
        setVideoMeta(prev => ({ ...prev, ...data.videoMeta }));
      }
    } catch {
      // ロード失敗はサイレントに無視（ローカルステートで継続）
    }
  }, []);

  // ── ログイン時にDBからスロット設定を読み込む ─────────────────────
  const loadSlotsFromDB = useCallback(async (token: string) => {
    setIsSlotsLoading(true);
    try {
      const res = await fetch('/api/slots', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.slot_ids)) {
        const restored = data.slot_ids.map((id: string | null) =>
          id ? TYPE_CATALOG.find(t => t.id === id) ?? null : null
        );
        setTypeSlots(restored);
        // 最初に埋まっているスロットをアクティブに設定
        const firstFilled = restored.findIndex((s: FaceType | null) => s !== null);
        if (firstFilled >= 0) setActiveSlotIndex(firstFilled);
      }
    } catch {
      // サイレント無視
    } finally {
      setIsSlotsLoading(false);
    }
  }, []);

  // スロット変更をDBに保存（デバウンス）
  const saveSlotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSlotsToDBRef = useRef<((slots: (FaceType | null)[], token: string) => void) | undefined>(undefined);
  saveSlotsToDBRef.current = (slots, token) => {
    if (saveSlotsTimerRef.current) clearTimeout(saveSlotsTimerRef.current);
    saveSlotsTimerRef.current = setTimeout(() => {
      const slot_ids = slots.map(s => s?.id ?? null);
      fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slot_ids }),
      }).catch(() => {});
    }, 800);
  };

  useEffect(() => {
    if (session?.access_token) {
      loadFeedbackFromDB(session.access_token);
      loadSlotsFromDB(session.access_token);
    }
  }, [session?.access_token, loadFeedbackFromDB, loadSlotsFromDB]);

  // ── 好み分析データ取得（count + topActresses + analysisText）────────
  useEffect(() => {
    if (isAuthLoading || hasCheckedPreferences) return;
    if (!session?.access_token) {
      setHasCheckedPreferences(true);
      setPreferenceCount(0);
      return;
    }
    const token = session.access_token;
    // analysis エンドポイントで count・好み女優・分析文を一括取得
    fetch('/api/actress/preferences/analysis', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { count: number; topActresses: PreferenceAnalysis['topActresses']; analysisText: string; characteristics: string[] }) => {
        setHasCheckedPreferences(true);
        setPreferenceCount(d.count);
        setPreferenceAnalysis({ count: d.count, topActresses: d.topActresses ?? [], analysisText: d.analysisText ?? '', characteristics: d.characteristics ?? [] });
        if (d.count === 0) setShowSwipeOnboarding(true);
      })
      .catch(() => { setHasCheckedPreferences(true); setPreferenceCount(0); });
  }, [session?.access_token, isAuthLoading, hasCheckedPreferences]);

  // ── 動画リスト変化時にコミュニティ統計を取得 ──────────────────────
  useEffect(() => {
    if (videos.length === 0) return;
    const realIds = videos.filter(v => v.source !== 'mock').map(v => v.id);
    if (realIds.length === 0) {
      // モック動画はダミー統計を生成
      const mockStats: Record<string, { keepCount: number; strikeCount: number; total: number }> = {};
      videos.forEach((v, i) => {
        const total = 12 + i * 7 + Math.floor(v.matchScore / 5);
        const strikeCount = Math.floor(total * (v.matchScore / 100) * 0.7);
        mockStats[v.id] = { keepCount: total - strikeCount, strikeCount, total };
      });
      setVideoStats(prev => ({ ...prev, ...mockStats }));
      return;
    }
    fetch(`/api/videos/stats?ids=${realIds.join(',')}`)
      .then(r => r.json())
      .then(data => { if (data.stats) setVideoStats(prev => ({ ...prev, ...data.stats })); })
      .catch(() => {});
  }, [videos]);

  // ── トレンド/タグ変更時にFANZA APIから動画を取得 ─────────────────
  const TREND_PAGE_SIZE = 20;
  const TREND_MAX_PAGES = 5; // 最大100件

  // viewMode変更時はページをリセット
  useEffect(() => {
    if (viewMode.type === 'trend') setTrendPage(0);
  }, [viewMode]);

  // ── ドストライク選抜：Route 0 からパーソナライズ動画をリアルタイム取得 ──
  // preferenceCount を待たず即時フェッチ（認証済みならRoute 0が動く）
  useEffect(() => {
    if (viewMode.type !== 'personal') return;
    if (!session?.access_token) return;
    let cancelled = false;
    setIsLoadingPersonalVideos(true);
    fetch('/api/videos/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ slotTypeIds: [], sortBy, limit: 20 }),
    })
      .then(r => r.json())
      .then((data: RecommendResponse) => {
        if (!cancelled) {
          setPersonalVideos(data.videos ?? []);
          setIsLoadingPersonalVideos(false);
        }
      })
      .catch(() => { if (!cancelled) setIsLoadingPersonalVideos(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode.type, session?.access_token, sortBy, personalRefreshKey]);

  useEffect(() => {
    if (viewMode.type !== 'trend') return;
    const trendKey = viewMode.value;
    const offset = trendPage * TREND_PAGE_SIZE;
    let cancelled = false;
    setIsTrendLoading(true);
    setTrendVideos([]);

    // キーワード直接検索
    if (trendKey?.startsWith('__keyword__')) {
      const keyword = trendKey.replace('__keyword__', '');
      fetch('/api/videos/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotTypeIds: [], sortBy, limit: TREND_PAGE_SIZE, offset, keyword, skipActressMatch: true }),
      })
        .then(r => r.json())
        .then((data: RecommendResponse) => {
          if (!cancelled) {
            setTrendVideos(data.videos ?? []);
            setIsTrendLoading(false);
          }
        })
        .catch(() => { if (!cancelled) setIsTrendLoading(false); });
      return () => { cancelled = true; };
    }

    const typeIds = trendKey
      ? (TREND_TO_TYPE_IDS[trendKey] ?? TREND_FALLBACK_IDS)
      : TREND_FALLBACK_IDS;
    fetch('/api/videos/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotTypeIds: typeIds, sortBy, limit: TREND_PAGE_SIZE, offset, skipActressMatch: true }),
    })
      .then(r => r.json())
      .then((data: RecommendResponse) => {
        if (!cancelled) {
          setTrendVideos(data.videos ?? []);
          setIsTrendLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setIsTrendLoading(false); });
    return () => { cancelled = true; };
  }, [viewMode, sortBy, trendPage]);

  // スロット変更時に自動保存
  const isFirstSlotLoad = useRef(true);
  useEffect(() => {
    // 初回レンダリングはスキップ（DBからの復元が済む前に上書きしない）
    if (isFirstSlotLoad.current) {
      isFirstSlotLoad.current = false;
      return;
    }
    if (session?.access_token) {
      saveSlotsToDBRef.current?.(typeSlots, session.access_token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeSlots, session?.access_token]);

  // ── フィードバック処理（ローカル更新 + DB保存） ────────────────────
  const handleFeedback = (videoId: string, action: 'strike'|'change'|'keep'|'', video?: VideoResult) => {
    // 楽観的UI更新（即座に反映）
    setFeedback(prev => ({...prev, [videoId]: action}));

    // メタデータをローカルにキャッシュ（保存リスト表示用）
    if (video && action !== '' && action !== 'change') {
      setVideoMeta(prev => ({ ...prev, [videoId]: video }));
    }

    // DB保存（ログイン中 かつ change以外）
    if (session?.access_token && action !== 'change') {
      fetch('/api/videos/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          videoId,
          action,
          faceTypeId: typeSlots.find(s => s !== null)?.id ?? null,
          videoMeta: video ? {
            title:         video.title,
            thumbnailUrl:  video.thumbnailUrl,
            affiliateUrl:  video.affiliateUrl,
            actress:       video.actress,
            matchScore:    video.matchScore,
            tags:          video.tags,
            price:         video.price,
            reviewAverage: video.reviewAverage,
            durationMin:   video.durationMin,
          } : undefined,
        }),
      }).catch(() => {}); // fire-and-forget
    }

    // Interstitial Ad Logic trigger (4アクションごとに表示)
    if (!isVip) {
       setInteractionCount(prev => {
          const next = prev + 1;
          if (next >= 4) {
             setTimeout(() => {
                setInterstitialAdIndex(prevIdx => (prevIdx + 1) % AFFILIATE_ADS.length);
                setShowInterstitialAd(true);
             }, 400);
             return 0;
          }
          return next;
       });
    }
  };

  const handleDeleteActress = async (actressId: string) => {
    if (!session?.access_token) return;
    // 存在確認して楽観的UI更新（両方のstateを同時更新）
    const exists = preferenceAnalysis?.topActresses.some(a => a.actress_id === actressId);
    if (!exists) return;
    setPreferenceAnalysis(prev => {
      if (!prev) return prev;
      const filtered = prev.topActresses.filter(a => a.actress_id !== actressId);
      return { ...prev, topActresses: filtered, count: Math.max(0, prev.count - 1) };
    });
    setPreferenceCount(prev => Math.max(0, (prev ?? 1) - 1));
    // API削除
    try {
      await fetch(`/api/actress/preferences?actress_id=${encodeURIComponent(actressId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch { /* サイレント */ }
  };

  // 保存リスト画面専用：Undoトースト付きの解除ハンドラ
  const handleKeepRemove = (videoId: string, prevAction: string) => {
    // 既存のトーストがあればタイマーをキャンセルして即コミット
    if (undoToast) {
      clearTimeout(undoToast.timerId);
      setFeedback(prev => ({ ...prev, [undoToast.seed]: '' }));
      // 直前のundoToastのDB削除も確定
      if (session?.access_token) {
        fetch('/api/videos/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ videoId: undoToast.seed, action: '' }),
        }).catch(() => {});
      }
    }

    const label = prevAction === 'keep' ? '💛 キープ' : '👍 いいね';
    const timerId = setTimeout(() => {
      // 5秒後：正式にfeedbackから削除してDBも更新
      setFeedback(prev => ({ ...prev, [videoId]: '' }));
      setUndoToast(null);
      if (session?.access_token) {
        fetch('/api/videos/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ videoId, action: '' }),
        }).catch(() => {});
      }
    }, 5000);

    setFeedback(prev => ({ ...prev, [videoId]: '__removed__' }));
    setUndoToast({ seed: videoId, prevAction, message: `${label}を解除しました`, timerId });
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

        <div className="overflow-y-auto p-4" style={{ height: '420px' }}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {filteredCatalog.map(type => {
              const isSelected = typeSlots.some(s => s?.id === type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                      : 'border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-card'
                  }`}
                >
                  <div
                    className="w-full aspect-square rounded-lg overflow-hidden relative"
                    onClick={() => setPreviewFace(type)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/faces/${type.id}.jpg`}
                      alt={type.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 shadow-md">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-center leading-tight text-foreground line-clamp-1 w-full">{type.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );


  /**
   * モード1：ドストライク選抜（スワイプ好み学習 ＋ パーソナライズ動画）
   */
  const renderPersonalMode = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── 好み設定カード ────────────────────────────────────── */}
        <div className="flex flex-col bg-card border border-border p-4 md:p-5 rounded-2xl shadow-md relative overflow-hidden mb-5">
          <div className="absolute top-0 right-0 p-24 bg-primary/5 blur-[100px] rounded-full -z-10" />
          {preferenceCount === null ? (
            /* ローディング */
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-full bg-secondary/60 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary/60 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-secondary/40 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ) : preferenceCount === 0 ? (
            /* 好み未設定 */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-sm md:text-base font-extrabold mb-1.5">好みの女優をスワイプして教える</h2>
              <p className="text-foreground/60 text-[11px] mb-5 leading-relaxed">
                10枚の写真を左右にスワイプするだけ。<br />AIがあなただけの作品をリストアップします。
              </p>
              <button
                onClick={() => setShowSwipeOnboarding(true)}
                className="px-6 py-3 bg-primary text-white rounded-full font-extrabold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                今すぐスワイプする →
              </button>
            </div>
          ) : (
            /* 好み設定済み：分析カード */
            <div className="flex flex-col gap-3">
              {/* AI分析テキスト + 5つの特徴 */}
              {(preferenceAnalysis?.analysisText || (preferenceAnalysis?.characteristics?.length ?? 0) > 0) && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 space-y-2">
                  {preferenceAnalysis?.analysisText && (
                    <p className="text-xs md:text-sm font-bold text-foreground/80 leading-relaxed">
                      🤖 {preferenceAnalysis.analysisText}
                    </p>
                  )}
                  {(preferenceAnalysis?.characteristics?.length ?? 0) > 0 && (
                    <ul className="space-y-1 mt-1">
                      {preferenceAnalysis!.characteristics.map((c, i) => (
                        <li key={i} className="text-[10px] md:text-xs text-foreground/70 leading-relaxed flex gap-1.5">
                          <span className="text-primary flex-shrink-0">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 好み女優グリッド（丸アイコン → FANZAアフィリエイトリンク） */}
              {preferenceAnalysis && preferenceAnalysis.topActresses.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-foreground/40 mb-2.5">あなたが好きな女優</p>
                  <div className="flex gap-3 md:gap-4 flex-wrap">
                    {preferenceAnalysis.topActresses.slice(0, 6).map(a => {
                      const fanzaUrl = `https://al.dmm.co.jp/?lurl=${encodeURIComponent(`https://www.dmm.co.jp/digital/videoa/-/list/=/article=actress/id=${a.actress_id}/`)}&af_id=dostrikeai-990&ch=actress_pref`;
                      return (
                        <div key={a.actress_id} className="relative flex flex-col items-center gap-1.5 w-[4rem] md:w-[4.5rem]">
                          <a href={fanzaUrl} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1.5 w-full">
                            <div className="w-[4rem] h-[4rem] md:w-[4.5rem] md:h-[4.5rem] rounded-full overflow-hidden border-2 border-border/60 group-hover:border-primary transition-all shadow-md relative flex-shrink-0">
                              {a.image_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={a.image_url} alt={a.actress_name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                  <span className="text-lg font-extrabold text-primary/50">{a.actress_name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-foreground/60 text-center leading-tight line-clamp-2 w-full">{a.actress_name}</span>
                          </a>
                          {/* 削除ボタン */}
                          <button
                            onClick={() => handleDeleteActress(a.actress_id)}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10"
                            aria-label="好みから削除"
                          >
                            <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 操作ボタン */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowSwipeOnboarding(true)}
                  className="text-[10px] font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors whitespace-nowrap"
                >
                  ＋ 追加スワイプ
                </button>
                <span className="text-[10px] text-foreground/30">{preferenceCount}人スワイプ済み</span>
              </div>
            </div>
          )}
        </div>

        {/* ── パーソナライズ動画グリッド ──────────────────────────── */}
        {preferenceCount === null ? null : preferenceCount === 0 ? (
          /* 好み未設定時の空欄 */
          <div className="text-center p-12 bg-card border border-border rounded-3xl mt-4 shadow-sm">
            <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-base font-bold text-foreground/70 mb-2">スワイプ後にここに表示されます</h3>
            <p className="text-foreground/50 text-xs">好みを登録すると、AIが厳選したおすすめ作品が表示されます。</p>
            <button
              onClick={() => setShowSwipeOnboarding(true)}
              className="mt-5 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              今すぐスワイプ →
            </button>
          </div>
        ) : (
          <div className="relative z-10 min-h-[500px]">
            {renderPersonalFeedHeader()}

            {/* ローディングスケルトン */}
            {isLoadingPersonalVideos && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5 mt-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex flex-col gap-1.5 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                    <div className="aspect-video bg-secondary/60 rounded-2xl animate-pulse relative overflow-hidden">
                      <div className="absolute top-2 left-2 w-12 h-4 bg-secondary rounded-lg animate-pulse" />
                    </div>
                    <div className="h-3 bg-secondary/60 rounded-full animate-pulse w-full" />
                    <div className="h-3 bg-secondary/40 rounded-full animate-pulse w-4/5" />
                    <div className="flex gap-1 mt-1">
                      <div className="w-8 h-8 rounded-full bg-secondary/60 animate-pulse flex-shrink-0" />
                      <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                      <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 動画グリッド */}
            {!isLoadingPersonalVideos && personalVideos.length > 0 && (() => {
              // PR動画をレコメンドにちりばめる（4動画ごとに1PR）
              type MergedItem = { type: 'video'; video: VideoResult } | { type: 'pr'; video: VideoResult; idx: number };
              const merged: MergedItem[] = [];
              let prIdx = 0;
              personalVideos.forEach((video, i) => {
                merged.push({ type: 'video', video });
                // 4動画ごとにPRを挟む (index 3, 8, 13...)
                if ((i + 1) % 4 === 0 && prIdx < adVideos.length) {
                  merged.push({ type: 'pr', video: adVideos[prIdx], idx: prIdx });
                  prIdx++;
                }
              });
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5 mt-4">
                  {merged.map((item) => {
                    if (item.type === 'video') {
                      const video = item.video;
                      const fb = feedback[video.id];
                      if (fb === 'change') {
                        return (
                          <div key={video.id} className="aspect-video bg-secondary/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border/60 p-4 text-center animate-in zoom-in-95 duration-300">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                            <p className="text-foreground/70 text-xs font-bold">AIが除外・再学習しました</p>
                          </div>
                        );
                      }
                      return (
                        <div key={video.id} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                          <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${fb === 'keep' ? 'border-yellow-400/70' : fb === 'strike' ? 'border-primary/70' : ''}`}>
                            <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap w-[90%]">
                                <div className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center shadow-lg border border-white/10">
                                  <Sparkles className="w-3 h-3 text-primary mr-1" />
                                  <span className="text-white font-extrabold text-[10px] tracking-wide">{video.matchScore}%</span>
                                </div>
                                {video.source === 'mock' && (
                                  <div className="bg-black/60 text-white/60 px-1.5 py-0.5 rounded-lg font-bold text-[9px] border border-white/10">DEMO</div>
                                )}
                                {fb === 'keep' && <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/> キープ中</div>}
                                {fb === 'strike' && <div className="bg-primary text-white px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/> いいね</div>}
                              </div>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 p-2">
                                <a
                                  href={video.affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center justify-center gap-1 bg-white text-black py-1.5 px-4 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current flex-shrink-0" /> サンプル再生
                                </a>
                                <a
                                  href={video.affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1 bg-white/20 border border-white/40 text-white py-1.5 px-4 rounded-full text-[10px] font-bold hover:bg-white/30 transition-colors whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" /> レビュー
                                </a>
                              </div>
                            </div>
                            <div className="flex gap-2 px-2 py-1.5 md:hidden">
                              <a
                                href={video.affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex flex-1 items-center justify-center gap-1 bg-black text-white py-1.5 rounded-lg text-[10px] font-bold"
                              >
                                サンプル再生
                              </a>
                              <a
                                href={video.affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-1 bg-secondary text-foreground py-1.5 rounded-lg text-[10px] font-bold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                レビュー
                              </a>
                            </div>
                            <div className="p-2.5 md:p-3 bg-secondary/10 flex flex-col border-t border-border/50 gap-1">
                              <div className="h-[2.8rem] overflow-hidden">
                                <a
                                  href={video.affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-[11px] md:text-sm text-foreground/90 line-clamp-2 leading-relaxed hover:text-primary transition-colors"
                                >
                                  {video.title}
                                </a>
                              </div>
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                {video.actress && (
                                  <div className="text-[10px] text-foreground/50 truncate flex-1">{video.actress}</div>
                                )}
                                {video.reviewAverage != null && (
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[10px] font-bold text-foreground/70">{video.reviewAverage.toFixed(1)}</span>
                                    {video.reviewCount != null && (
                                      <span className="text-[9px] text-foreground/40">({video.reviewCount.toLocaleString()})</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const stat = videoStats[video.id];
                                if (!stat || stat.total === 0) return null;
                                const pct = Math.round((stat.strikeCount / stat.total) * 100);
                                return (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Users className="w-2.5 h-2.5 text-foreground/30 flex-shrink-0" />
                                    <span className="text-[9px] text-foreground/40 font-bold">
                                      {stat.total}人中 <span className="text-primary">{pct}%</span>がいいね
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-1 md:gap-2 justify-between items-center w-full px-0.5">
                            <button onClick={() => handleFeedback(video.id, 'change', video)} className={`flex flex-shrink-0 items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${fb==='change' ? 'bg-red-500 text-white' : 'bg-secondary border border-border text-foreground/70 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                              <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => handleFeedback(video.id, fb === 'keep' ? '' : 'keep', video)} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-2 md:px-4 rounded-full font-bold text-[9px] md:text-[10px] transition-all ${fb === 'keep' ? 'bg-yellow-400 text-black' : 'bg-secondary border border-border text-foreground/70 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'}`}>
                              <Heart className={`w-3 h-3 md:w-3 md:h-3 flex-shrink-0 ${fb === 'keep' ? 'fill-current' : ''}`} />
                              <span>キープ</span>
                            </button>
                            <button onClick={() => handleFeedback(video.id, fb === 'strike' ? '' : 'strike', video)} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-[9px] md:text-[10px] transition-all shadow-sm ${fb==='strike' ? 'bg-primary text-white' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white'}`}>
                              <ThumbsUp className="w-3 h-3 md:w-3 md:h-3 flex-shrink-0" />
                              <span>いいね</span>
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // PR動画 - 通常動画と同じ見た目 + PRバッジ + 通常ボタン
                      const adVideo = item.video;
                      const fb = feedback[adVideo.id];
                      return (
                        <div key={`pr-${item.idx}`} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                          <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${fb === 'keep' ? 'border-yellow-400/70' : fb === 'strike' ? 'border-primary/70' : 'border-primary/25'}`}>
                            <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={adVideo.thumbnailUrl} alt={adVideo.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap w-[90%]">
                                <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg font-extrabold text-[10px] tracking-wide shadow-lg">PR</div>
                                {fb === 'keep' && <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/>キープ中</div>}
                                {fb === 'strike' && <div className="bg-primary text-white px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg flex items-center whitespace-nowrap flex-shrink-0"><ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0"/>いいね</div>}
                              </div>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 p-2">
                                <a href={adVideo.affiliateUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-1 bg-white text-black py-1.5 px-4 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform whitespace-nowrap">
                                  <Play className="w-2.5 h-2.5 fill-current flex-shrink-0" /> FANZAで見る
                                </a>
                              </div>
                            </div>
                            <div className="flex gap-2 px-2 py-1.5 md:hidden">
                              <a href={adVideo.affiliateUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1 bg-black text-white py-1.5 rounded-lg text-[10px] font-bold">
                                <Play className="w-3 h-3 fill-current" /> FANZAで見る
                              </a>
                            </div>
                            <div className="p-2.5 md:p-3 bg-secondary/10 flex flex-col border-t border-border/50 gap-1">
                              <div className="h-[2.8rem] overflow-hidden">
                                <a href={adVideo.affiliateUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[11px] md:text-sm text-foreground/90 line-clamp-2 leading-relaxed hover:text-primary transition-colors">
                                  {adVideo.title}
                                </a>
                              </div>
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                {adVideo.actress && <div className="text-[10px] text-foreground/50 truncate flex-1">{adVideo.actress}</div>}
                                {adVideo.reviewAverage != null && (
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[10px] font-bold text-foreground/70">{adVideo.reviewAverage.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 md:gap-2 justify-between items-center w-full px-0.5">
                            <button onClick={() => handleFeedback(adVideo.id, 'change', adVideo)} className={`flex flex-shrink-0 items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${fb==='change' ? 'bg-red-500 text-white' : 'bg-secondary border border-border text-foreground/70 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                              <ThumbsDown className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => handleFeedback(adVideo.id, fb === 'keep' ? '' : 'keep', adVideo)} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 py-2 md:py-2.5 px-2 md:px-4 rounded-full font-bold text-[9px] md:text-[10px] transition-all ${fb === 'keep' ? 'bg-yellow-400 text-black' : 'bg-secondary border border-border text-foreground/70 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'}`}>
                              <Heart className={`w-3 h-3 md:w-3 md:h-3 flex-shrink-0 ${fb === 'keep' ? 'fill-current' : ''}`} />
                              <span>キープ</span>
                            </button>
                            <button onClick={() => handleFeedback(adVideo.id, fb === 'strike' ? '' : 'strike', adVideo)} className={`whitespace-nowrap flex flex-1 items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 py-2 md:py-2.5 rounded-full font-bold text-[9px] md:text-[10px] transition-all shadow-sm ${fb==='strike' ? 'bg-primary text-white' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white'}`}>
                              <ThumbsUp className="w-3 h-3 md:w-3 md:h-3 flex-shrink-0" />
                              <span>いいね</span>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              );
            })()}

            {/* 動画なし（フォールバック） */}
            {!isLoadingPersonalVideos && personalVideos.length === 0 && (
              <div className="text-center p-12 bg-card border border-border rounded-3xl mt-4 shadow-sm">
                <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-base font-bold text-foreground/70 mb-2">作品を探しています...</h3>
                <p className="text-foreground/50 text-xs">しばらく待ってからページを更新してください。</p>
              </div>
            )}
          </div>
        )}
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

  const renderPersonalFeedHeader = () => (
    <div className="flex flex-row items-center justify-between gap-2 md:gap-4 pb-2 md:pb-3 border-b border-border/50 relative z-30 mb-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base md:text-xl font-extrabold flex items-center text-foreground">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary mr-2 flex-shrink-0" />
          ⚡ リアルタイムAIマッチ
        </h3>
        <p className="text-[10px] md:text-xs text-foreground/50 mt-0.5 ml-7 font-medium">
          あなたの好みに近い女優を提案します
        </p>
      </div>
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
          🔥 人気ランキング
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
            key={tag.label}
            onClick={() => setViewMode({ type: 'trend', value: '__keyword__' + tag.keyword })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${viewMode.type === 'trend' && 'value' in viewMode && viewMode.value === '__keyword__' + tag.keyword ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground/70 hover:border-primary/50'}`}
          >
            {tag.label}
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
    const displayKey = trendValue?.startsWith('__keyword__') ? trendValue.replace('__keyword__', '') : trendValue;
    const title = displayKey ? `${displayKey} の人気動画` : "人気ランキング";
    
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
        {renderMobileTrendsBar()}
        
        {/* 検索バー */}
        <div className="relative mb-5 max-w-2xl">
           <input type="text" placeholder="好みのキーワードで検索する" className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm shadow-black/5" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { setViewMode({ type: 'trend', value: '__keyword__' + searchQuery.trim() }); } }} />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
           {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"><X className="w-4 h-4"/></button>}
        </div>

        {renderFeedHeader(<><TrendingUp className="w-6 h-6 text-primary mr-2 hidden sm:block" /> {title}</>)}
        
        {/* Loading skeleton */}
        {isTrendLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 mt-6 pb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="aspect-video bg-secondary/60 rounded-2xl animate-pulse" />
                <div className="h-3 bg-secondary/60 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-secondary/40 rounded-full animate-pulse w-4/5" />
                <div className="flex gap-1 mt-1">
                  <div className="w-8 h-8 rounded-full bg-secondary/60 animate-pulse flex-shrink-0" />
                  <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                  <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isTrendLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 mt-6 pb-8">
            {trendVideos.map((v, idx) => {
              const fb = feedback[v.id];
              const stat = videoStats[v.id];
              return (
                <div key={v.id} className="flex flex-col gap-1.5 pb-2">
                  <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${fb === 'keep' ? 'border-yellow-400/70 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : fb === 'strike' ? 'border-primary/70 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
                    <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnailUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />

                      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[85%]">
                        {v.source === 'mock' && (
                          <div className="bg-black/60 text-white/60 px-1.5 py-0.5 rounded-lg font-bold text-[9px] border border-white/10">DEMO</div>
                        )}
                        {fb === 'keep' && (
                          <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg flex items-center shadow-lg font-bold text-[10px] whitespace-nowrap">
                            <Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> キープ中
                          </div>
                        )}
                        {fb === 'strike' && (
                          <div className="bg-primary text-white px-2 py-0.5 rounded-lg flex items-center shadow-lg font-bold text-[10px] whitespace-nowrap">
                            <ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> いいね
                          </div>
                        )}
                      </div>

                      {/* ホバーオーバーレイ */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 p-2">
                        <a
                          href={v.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1 bg-white text-black py-1.5 px-4 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                        >
                          <Play className="w-2.5 h-2.5 fill-current flex-shrink-0" /> サンプル再生
                        </a>
                        <a
                          href={v.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 bg-white/20 border border-white/40 text-white py-1.5 px-4 rounded-full text-[10px] font-bold hover:bg-white/30 transition-colors whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" /> レビュー
                        </a>
                      </div>
                    </div>

                    {/* スマホ用アクションボタン（常時表示） */}
                    <div className="flex gap-2 px-2 py-1.5 md:hidden">
                      <a
                        href={v.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-1 items-center justify-center gap-1 bg-black text-white py-1.5 rounded-lg text-[10px] font-bold"
                      >
                        サンプル再生
                      </a>
                      <a
                        href={v.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 bg-secondary text-foreground py-1.5 rounded-lg text-[10px] font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        レビュー
                      </a>
                    </div>

                    <div className="p-2.5 md:p-3 bg-secondary/10 border-t border-border/50 flex flex-col gap-1">
                      <div className="h-[2.8rem] overflow-hidden">
                      <a
                        href={v.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[11px] md:text-sm line-clamp-2 leading-relaxed text-foreground/90 hover:text-primary transition-colors"
                      >
                        {v.title}
                      </a>
                      </div>
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        {v.actress && (
                          <div className="text-[10px] text-foreground/50 truncate flex-1">{v.actress}</div>
                        )}
                        {v.reviewAverage != null && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-bold text-foreground/70">{v.reviewAverage.toFixed(1)}</span>
                            {v.reviewCount != null && (
                              <span className="text-[9px] text-foreground/40">({v.reviewCount.toLocaleString()})</span>
                            )}
                          </div>
                        )}
                      </div>
                      {stat && stat.total > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="w-2.5 h-2.5 text-foreground/30 flex-shrink-0" />
                          <span className="text-[9px] text-foreground/40 font-bold">
                            {stat.total}人中 <span className="text-primary">{Math.round((stat.strikeCount / stat.total) * 100)}%</span>がいいね
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1.5 w-full items-center">
                    <button
                      onClick={() => handleFeedback(v.id, 'change', v)}
                      className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all ${fb === 'change' ? 'bg-red-500 text-white' : 'bg-secondary border border-border text-foreground/70 hover:bg-red-500 hover:text-white hover:border-red-500'}`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(v.id, fb === 'keep' ? '' : 'keep', v)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full font-bold text-[10px] transition-all ${fb === 'keep' ? 'bg-yellow-400 text-black' : 'bg-secondary border border-border text-foreground/80 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black'}`}
                    >
                      <Heart className={`w-3 h-3 flex-shrink-0 ${fb === 'keep' ? 'fill-current' : ''}`} />
                      <span>キープ</span>
                    </button>
                    <button
                      onClick={() => handleFeedback(v.id, fb === 'strike' ? '' : 'strike', v)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full font-bold text-[10px] transition-all ${fb === 'strike' ? 'bg-primary text-white' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white'}`}
                    >
                      <ThumbsUp className="w-3 h-3 flex-shrink-0" />
                      <span>いいね</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ページネーション */}
        {!isTrendLoading && (
          <div className="flex items-center justify-center gap-3 mt-6 pb-8">
            <button
              onClick={() => { setTrendPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={trendPage === 0}
              className="px-4 py-2 rounded-full text-xs font-bold border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              ← 前へ
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: TREND_MAX_PAGES }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { setTrendPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${trendPage === i ? 'bg-primary text-white' : 'bg-secondary text-foreground/60 hover:bg-border'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setTrendPage(p => Math.min(TREND_MAX_PAGES - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={trendPage === TREND_MAX_PAGES - 1 || trendVideos.length < TREND_PAGE_SIZE}
              className="px-4 py-2 rounded-full text-xs font-bold border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              次へ →
            </button>
          </div>
        )}
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
           動画で「キープ」または「いいね」を押した動画の一覧が表示されます。
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
                👍 いいね
              </button>
            </div>
         </div>
         {/* 件数 */}
         {keepEntries.length > 0 && (
           <p className="text-xs text-foreground/40 font-bold mb-4">{keepEntries.length}件保存中</p>
         )}

         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {keepEntries.length === 0 ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                     <Heart className="w-8 h-8 text-foreground/20 stroke-2" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-1">まだ保存されていません</h3>
                  <p className="text-xs text-foreground/50 font-medium max-w-[220px] mx-auto leading-relaxed">
                    選抜やトレンドモードで気になる作品に💛や👍をつけましょう
                  </p>
                  <button
                    onClick={() => setViewMode({ type: 'personal' })}
                    className="mt-5 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
                  >
                    AIマッチを見る →
                  </button>
               </div>
            ) : (
               keepEntries.map(([videoId, action]) => {
                  // リアルメタデータ優先、なければフォールバック
                  const meta = videoMeta[videoId];
                  const numSeed = parseInt(videoId, 10) || 0;
                  const fallbackImgId = FEMALE_IMAGE_IDS[numSeed % FEMALE_IMAGE_IDS.length];
                  const thumbnailSrc = meta?.thumbnailUrl
                    || `https://images.unsplash.com/photo-${fallbackImgId}?w=400&h=250&fit=crop`;
                  const title = meta?.title || MOCK_TITLES[(numSeed * 5) % MOCK_TITLES.length];
                  const affiliateUrl = meta?.affiliateUrl;
                  const matchScore = meta?.matchScore;
                  const actress = meta?.actress && meta.actress !== '不明' ? meta.actress : null;
                  const price = meta?.price;
                  const hasMeta = !!meta;

                  return (
                    <div key={videoId} className="flex flex-col gap-1.5 md:gap-2 pb-5 md:pb-6 border-b border-border/20 md:border-none">
                      <div className={`group relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${action === 'keep' ? 'border-yellow-400/70 shadow-[0_0_12px_rgba(250,204,21,0.15)]' : action === 'strike' ? 'border-primary/70 shadow-[0_0_12px_rgba(244,63,94,0.15)]' : ''}`}>
                        {/* サムネイル */}
                        <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbnailSrc} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                          {/* 左上バッジ */}
                          <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[85%]">
                            {matchScore && (
                              <div className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center shadow-lg border border-white/10">
                                <Sparkles className="w-3 h-3 text-primary mr-1" />
                                <span className="text-white font-extrabold text-[10px]">{matchScore}%</span>
                              </div>
                            )}
                            {!hasMeta && (
                              <div className="bg-black/60 text-white/60 px-1.5 py-0.5 rounded-lg font-bold text-[9px] border border-white/10">DEMO</div>
                            )}
                          </div>

                          {/* 右上ステータスバッジ */}
                          {action === 'keep' && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-0.5 flex items-center rounded-lg shadow-lg font-bold text-[10px] whitespace-nowrap">
                              <Heart className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> キープ
                            </div>
                          )}
                          {action === 'strike' && (
                            <div className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 flex items-center rounded-lg shadow-lg font-bold text-[10px] whitespace-nowrap">
                              <ThumbsUp className="w-2.5 h-2.5 mr-1 fill-current flex-shrink-0" /> いいね
                            </div>
                          )}

                          {/* ホバー：ボタン */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3">
                            {affiliateUrl ? (
                              <>
                                <a
                                  href={affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1 bg-white text-black py-1.5 px-4 rounded-full text-[10px] font-bold shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current flex-shrink-0" /> サンプル再生
                                </a>
                                <a
                                  href={affiliateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1 bg-white/20 border border-white/50 text-white py-1.5 px-4 rounded-full text-[10px] font-bold hover:bg-white/30 transition-colors whitespace-nowrap"
                                >
                                  <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" /> レビュー
                                </a>
                              </>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 bg-white/80 text-black/60 py-2 px-5 rounded-full text-[11px] font-bold shadow-xl">
                                <Play className="w-3 h-3" /> DEMO
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 情報エリア */}
                        <div className="p-2.5 md:p-3 bg-secondary/10 border-t border-border/50 flex flex-col gap-1">
                          {affiliateUrl ? (
                            <a
                              href={affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-[11px] md:text-xs line-clamp-2 leading-relaxed text-foreground/90 hover:text-primary transition-colors"
                            >
                              {title}
                            </a>
                          ) : (
                            <p className="font-bold text-[11px] md:text-xs line-clamp-2 leading-relaxed text-foreground/90">
                              {title}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            {actress && (
                              <span className="text-[9px] md:text-[10px] text-foreground/50 font-bold truncate flex-1">{actress}</span>
                            )}
                            {meta?.reviewAverage != null ? (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-bold">{meta.reviewAverage.toFixed(1)}</span>
                                {meta?.reviewCount != null && (
                                  <span className="text-[9px] text-foreground/40">({meta.reviewCount.toLocaleString()})</span>
                                )}
                              </div>
                            ) : price ? (
                              <span className="text-[9px] md:text-[10px] text-primary font-extrabold flex-shrink-0">¥{price}</span>
                            ) : null}
                          </div>
                          {(() => {
                            const stat = videoStats[videoId];
                            if (!stat || stat.total === 0) return null;
                            const pct = Math.round((stat.strikeCount / stat.total) * 100);
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Users className="w-2.5 h-2.5 text-foreground/30 flex-shrink-0" />
                                <span className="text-[9px] text-foreground/40 font-bold">
                                  {stat.total}人中 <span className="text-primary">{pct}%</span>がいいね
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex gap-1 md:gap-2 w-full justify-between items-center px-0.5">
                          <button
                            onClick={() => handleKeepRemove(videoId, action)}
                            className="flex flex-shrink-0 items-center justify-center gap-1 px-2 h-8 md:h-9 rounded-full transition-all bg-secondary border border-border text-foreground/60 hover:bg-red-500 hover:text-white hover:border-red-500 text-[9px] md:text-[10px] font-bold whitespace-nowrap"
                            title="解除する"
                          >
                            <X className="w-3 h-3 flex-shrink-0" />
                            <span>解除</span>
                          </button>
                          {affiliateUrl ? (
                            <a
                              href={affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-1 py-1.5 rounded-full font-bold text-[9px] md:text-[10px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors"
                            >
                              <Play className="w-3 h-3 flex-shrink-0" /><span>視聴する</span>
                            </a>
                          ) : (
                            <div className={`flex flex-1 items-center justify-center gap-1 py-1.5 rounded-full font-bold text-[9px] md:text-[10px] ${action === 'keep' ? 'bg-yellow-400/20 text-yellow-600 border border-yellow-400/30' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                              {action === 'keep'
                                ? <><Heart className="w-3 h-3 fill-current flex-shrink-0" /><span>キープ中</span></>
                                : <><ThumbsUp className="w-3 h-3 fill-current flex-shrink-0" /><span>いいね中</span></>}
                            </div>
                          )}
                      </div>
                    </div>
                  );
               })
            )}
         </div>
      </div>
    );
  };

  // ── 認証確認中はページ全体スケルトンを表示 ─────────────────────
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm flex items-center justify-between px-4 md:px-8 py-3 h-14">
          <div className="w-8 h-8 sm:hidden" />
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1 md:p-1.5 rounded-lg"><Video className="w-5 h-5 text-primary-foreground" /></div>
            <span className="text-xl font-extrabold tracking-tight">ドストライク<span className="text-primary">AI</span></span>
          </div>
          <div className="w-8 h-8" />
        </header>
        <div className="flex-1 w-full px-3 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10 grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-8">
          <div className="xl:col-span-6 xl:col-start-4 space-y-4">
            {/* スロットエリアスケルトン */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-md">
              <div className="h-4 w-40 bg-secondary/60 rounded-full animate-pulse mb-2" />
              <div className="h-3 w-64 bg-secondary/40 rounded-full animate-pulse mb-4" />
              <div className="flex gap-3 pt-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="rounded-2xl animate-pulse bg-secondary/70 flex-shrink-0 w-[60px] h-[60px]" />
                ))}
              </div>
            </div>
            {/* ビデオグリッドスケルトン */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-5 mt-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="aspect-video bg-secondary/60 rounded-2xl animate-pulse" />
                  <div className="h-3 bg-secondary/60 rounded-full animate-pulse w-full" />
                  <div className="h-3 bg-secondary/40 rounded-full animate-pulse w-4/5" />
                  <div className="flex gap-1 mt-1">
                    <div className="w-8 h-8 rounded-full bg-secondary/60 animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                    <div className="flex-1 h-8 rounded-full bg-secondary/50 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <Link href="/column" className="text-xs font-bold text-foreground/70 hover:text-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> コラム
          </Link>
          <Link href="/guide" className="text-xs font-bold text-foreground/70 hover:text-foreground">ご利用ガイド</Link>
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
        <div className="hidden xl:block xl:col-span-2">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-6 pb-20">

            <div className="bg-card border border-border p-4 rounded-3xl shadow-sm">
              <h3 className="font-extrabold flex items-center gap-2 mb-4 text-foreground text-xs">
                <TrendingUp className="w-5 h-5 text-primary" /> 探す・見つける
              </h3>
              <div className="space-y-1 mt-4">
                <button
                  onClick={() => handleTrendClick(null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-colors border ${viewMode.type === 'trend' && !viewMode.value ? 'bg-primary text-white border-primary shadow-md' : 'border-transparent text-foreground hover:bg-secondary'}`}
                >
                  <TrendingUp className="w-4 h-4" /> 人気ランキング
                </button>
                <div className="my-2 border-t border-border w-1/2 mx-auto" />
                {TRENDS.map((t) => (
                  <div key={t.rank} onClick={() => handleTrendClick(t.name)} className={`flex items-center gap-3 p-2 rounded-xl group cursor-pointer transition-colors border ${viewMode.type === 'trend' && viewMode.value === t.name ? 'bg-foreground text-background border-foreground shadow-sm' : 'border-transparent hover:bg-secondary/50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                      {t.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xs group-hover:text-primary transition-colors line-clamp-1">{t.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-border group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-3xl shadow-sm">
              <h3 className="font-extrabold flex items-center gap-2 mb-4 text-foreground text-xs">
                <Hash className="w-5 h-5 text-accent" /> 発見タグ
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAG_LIST.map((tag, i) => (
                  <span key={i} onClick={() => setViewMode({ type: 'trend', value: '__keyword__' + tag.keyword })} className={`cursor-pointer px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors border ${viewMode.type === 'trend' && viewMode.value === '__keyword__' + tag.keyword ? 'bg-foreground text-background border-foreground' : 'bg-secondary text-foreground/80 hover:bg-border border-border/40'}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            中央メイン: ユーザー設定＆動画一覧
        ======================== */}
        <div className="xl:col-span-8 min-w-0 flex flex-col">

          {/* ── スワイプオンボーディング（好み未設定時） ─────────────── */}
          {showSwipeOnboarding && (
            <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-extrabold text-sm">ドストライクAI — 初回設定</span>
                </div>
                <button
                  onClick={() => setShowSwipeOnboarding(false)}
                  className="text-foreground/50 hover:text-foreground text-xs font-bold underline"
                >
                  スキップ
                </button>
              </div>
              <div className="flex-1 flex items-start justify-center py-4">
                <SwipeOnboarding
                  authToken={session?.access_token}
                  onComplete={() => {
                    setShowSwipeOnboarding(false);
                    // 好み分析データ再取得 + 動画リフレッシュ
                    setHasCheckedPreferences(false);
                    setPreferenceAnalysis(null);
                    setPersonalRefreshKey(k => k + 1);
                  }}
                />
              </div>
            </div>
          )}

          {/* 最上位ナビゲーションタブ (PC/タブレット用) */}
          <div className="hidden sm:flex bg-card border border-border p-1 rounded-[2rem] items-center mb-4 shadow-sm overflow-hidden z-20">
            <button
              onClick={() => setViewMode({ type: 'personal' })}
              className={`flex-1 py-2 text-xs md:text-sm font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'personal' ? 'bg-primary text-white shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 🎯 ドストライク選抜
            </button>
            <button
              onClick={() => setViewMode({ type: 'trend', value: 'value' in viewMode ? viewMode.value : null })}
              className={`flex-1 py-2 text-xs md:text-sm font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'trend' ? 'bg-foreground text-background shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> 🔥 トレンド・発見
            </button>
            <button
              onClick={() => setViewMode({ type: 'keep' })}
              className={`flex-1 py-2 text-xs md:text-sm font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2
                ${viewMode.type === 'keep' ? 'bg-yellow-400 text-black shadow-md scale-100' : 'text-foreground/50 hover:text-foreground hover:bg-secondary scale-95'}`}
            >
              <Heart className="w-3.5 h-3.5" /> 💛 保存リスト
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
        <div className="hidden xl:block xl:col-span-2">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-6 pb-20">

            <div className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold pt-2 mb-3">Sponsored / PR</div>

            {/* FANZAランキング動画を広告として表示 */}
            {adVideos.slice(2, 7).map((adVideo, index) => {
               const isWide = index % 2 === 0;
               return (
                 <a
                   key={`side-ad-${adVideo.id}`}
                   href={adVideo.affiliateUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`block rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-border/40 hover:border-primary/50 ${isWide ? 'aspect-[5/3]' : 'aspect-[3/4]'}`}
                 >
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={adVideo.thumbnailUrl} alt={adVideo.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                   <div className="absolute top-2 left-2">
                     <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[9px] font-extrabold">PR</span>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
                     <div className="font-bold text-[11px] line-clamp-2 leading-snug mb-1.5">{adVideo.title}</div>
                     {adVideo.actress && (
                       <div className="text-[10px] text-white/70 truncate mb-1.5">{adVideo.actress}</div>
                     )}
                     <div className="flex items-center justify-between">
                       {adVideo.reviewAverage != null && (
                         <div className="flex items-center gap-0.5">
                           <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                           <span className="text-[10px] font-bold text-yellow-300">{adVideo.reviewAverage.toFixed(1)}</span>
                         </div>
                       )}
                       <span className="text-[9px] text-white/80 font-bold ml-auto bg-white/15 px-2 py-0.5 rounded-full group-hover:bg-primary transition-colors">
                         FANZAで見る →
                       </span>
                     </div>
                   </div>
                 </a>
               );
            })}

            {/* adVideos未ロード時のスケルトン */}
            {adVideos.length < 3 && AFFILIATE_ADS.slice(0, 5).map((ad, index) => {
               const isWide = index % 2 === 0;
               return (
                 <a
                   key={`fallback-ad-${index}`}
                   href={ad.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`block bg-secondary/30 rounded-2xl overflow-hidden border border-border/40 animate-pulse ${isWide ? 'aspect-[5/3]' : 'aspect-[3/4]'}`}
                 />
               );
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
              
              <a
                href={AFFILIATE_ADS[interstitialAdIndex].url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowInterstitialAd(false)}
                className={`w-full mt-2 py-3.5 ${AFFILIATE_ADS[interstitialAdIndex].color} hover:opacity-90 rounded-xl font-extrabold flex items-center justify-center shadow-md transition-all text-sm`}
              >
                FANZAで今すぐ見る →
              </a>
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

      {/* サンプル動画: affiliateUrlで直接FANZAへ遷移するため、iframeモーダルは廃止 */}

      {/* ライトボックス（モーダル外に配置してモーダルが閉じても表示できる） */}
      {previewFace && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewFace(null)}
        >
          <div
            className="relative max-w-sm w-[80vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/faces/${previewFace.id}.jpg`}
              alt={previewFace.name}
              className="w-full rounded-3xl shadow-2xl object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent rounded-b-3xl p-5">
              <p className="text-white font-extrabold text-lg">{previewFace.name}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {previewFace.tags.map(tag => (
                  <span key={tag} className="text-white/70 text-xs font-bold">{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { handleTypeSelect(previewFace); setPreviewFace(null); }}
                  className="flex-1 py-2.5 bg-primary text-white rounded-full font-extrabold text-sm hover:bg-primary/90 transition-colors shadow-lg"
                >
                  このタイプを選ぶ ✓
                </button>
                <button
                  onClick={() => setPreviewFace(null)}
                  className="px-4 py-2.5 bg-white/20 text-white rounded-full font-bold text-sm hover:bg-white/30 transition-colors"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
