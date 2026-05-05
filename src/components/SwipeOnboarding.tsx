'use client';

/**
 * SwipeOnboarding
 *
 * 女優カードを左右にスワイプ（またはボタン操作）して
 * 好みを学習するオンボーディングUI。
 *
 * - Step 1: 事前フィルター選択（体型・年代）
 * - Step 2: スワイプ（タッチ/マウス/キーボード対応）
 * - 10枚判定後 user_actress_preferences に保存して onComplete() を呼ぶ
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, X, ChevronLeft, ChevronRight, Sparkles, SkipForward } from 'lucide-react';
import type { SwipeDeckActress } from '@/app/api/actress/swipe-deck/route';

interface Props {
  onComplete: () => void;
  authToken?: string;
}

// ── フィルター定義 ──────────────────────────────────────────────────
type BodyFilter   = 'all' | 'スレンダー' | '普通' | 'グラマー';
type AgeFilter    = 'all' | '10代' | '20代' | '30代以上';
type HeightFilter = 'all' | '小柄' | '普通' | '高身長';
type VibeFilter   = 'all' | '清楚系' | 'キュート系' | 'セクシー系' | 'クール系' | '天然系';

const BODY_OPTIONS: { value: BodyFilter; label: string; emoji: string }[] = [
  { value: 'all',      label: '指定なし',   emoji: '✨' },
  { value: 'スレンダー', label: 'スレンダー', emoji: '🌿' },
  { value: '普通',      label: 'ノーマル',   emoji: '⚖️' },
  { value: 'グラマー',  label: 'グラマー',   emoji: '🔥' },
];

const HEIGHT_OPTIONS: { value: HeightFilter; label: string; emoji: string }[] = [
  { value: 'all',    label: '指定なし', emoji: '✨' },
  { value: '小柄',   label: '小柄',     emoji: '🌸' },
  { value: '普通',   label: 'ノーマル', emoji: '⚖️' },
  { value: '高身長', label: '高身長',   emoji: '💃' },
];

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: 'all',      label: '指定なし' },
  { value: '10代',     label: '10代'    },
  { value: '20代',     label: '20代'    },
  { value: '30代以上', label: '30代以上' },
];

const VIBE_OPTIONS: { value: VibeFilter; label: string; emoji: string }[] = [
  { value: 'all',      label: '指定なし',   emoji: '✨' },
  { value: '清楚系',   label: '清楚・上品', emoji: '🌸' },
  { value: 'キュート系', label: 'キュート', emoji: '💗' },
  { value: 'セクシー系', label: 'セクシー', emoji: '🔥' },
  { value: 'クール系', label: 'クール',     emoji: '🖤' },
  { value: '天然系',   label: '天然・素朴', emoji: '🌿' },
];

const REQUIRED_SWIPES = 10;

export default function SwipeOnboarding({ onComplete, authToken }: Props) {
  // ── フィルター選択フェーズ ────────────────────────────────────────
  const [phase, setPhase]             = useState<'filter' | 'swipe'>('filter');
  const [bodyFilter, setBodyFilter]   = useState<BodyFilter>('all');
  const [ageFilter, setAgeFilter]     = useState<AgeFilter>('all');
  const [heightFilter, setHeightFilter] = useState<HeightFilter>('all');
  const [vibeFilter, setVibeFilter]   = useState<VibeFilter>('all');

  // ── スワイプフェーズ ─────────────────────────────────────────────
  const [deck, setDeck]             = useState<SwipeDeckActress[]>([]);
  const [index, setIndex]           = useState(0);
  const [isLoading, setIsLoading]   = useState(false);
  const [isSaving, setIsSaving]     = useState(false);

  const [dragX, setDragX]           = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX  = useRef(0);
  const dragXRef    = useRef(0);          // ref版（staleクロージャ回避用）
  const cardRef     = useRef<HTMLDivElement>(null);
  const decisions   = useRef<{ actress: SwipeDeckActress; liked: boolean }[]>([]);

  // フィルターを適用しながらデッキを取得
  const loadDeck = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (bodyFilter   !== 'all') params.set('body',   bodyFilter);
    if (ageFilter    !== 'all') params.set('age',    ageFilter);
    if (heightFilter !== 'all') params.set('height', heightFilter);
    if (vibeFilter   !== 'all') params.set('vibe',   vibeFilter);

    fetch(`/api/actress/swipe-deck?${params}`)
      .then(r => r.json())
      .then((d: { actresses: SwipeDeckActress[] }) => {
        setDeck(d.actresses ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [bodyFilter, ageFilter, heightFilter, vibeFilter]);

  // スワイプフェーズ開始時にデッキ取得
  useEffect(() => {
    if (phase === 'swipe') loadDeck();
  }, [phase, loadDeck]);

  // ── 判定処理 ────────────────────────────────────────────────────
  const decide = useCallback(async (liked: boolean) => {
    if (index >= deck.length || isSaving) return;

    const actress = deck[index];
    decisions.current.push({ actress, liked });
    const newIndex = index + 1;
    setIndex(newIndex);
    setDragX(0);

    if (decisions.current.length >= REQUIRED_SWIPES) {
      setIsSaving(true);
      await savePreferences(decisions.current, authToken);
      onComplete();
    }
  }, [index, deck, isSaving, authToken, onComplete]);

  // キーボード操作（スワイプフェーズのみ）
  useEffect(() => {
    if (phase !== 'swipe') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide(true);
      if (e.key === 'ArrowLeft')  decide(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [decide, phase]);

  // デッキを全枚使い切ったとき（REQUIRED_SWIPES未満でも）自動保存して完了
  useEffect(() => {
    if (
      phase === 'swipe' &&
      !isLoading &&
      !isSaving &&
      deck.length > 0 &&
      index >= deck.length &&
      decisions.current.length > 0
    ) {
      setIsSaving(true);
      savePreferences(decisions.current, authToken).then(() => onComplete());
    }
  }, [phase, isLoading, isSaving, deck.length, index, authToken, onComplete]);

  // ── タッチ/マウス操作（dragXRefでstaleクロージャを回避）─────────
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragXRef.current = 0;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const v = e.touches[0].clientX - dragStartX.current;
    dragXRef.current = v;
    setDragX(v);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    const v = dragXRef.current;
    dragXRef.current = 0;
    if (Math.abs(v) > 80) decide(v > 0); else setDragX(0);
  };
  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    dragXRef.current = 0;
    setIsDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const v = e.clientX - dragStartX.current;
    dragXRef.current = v;
    setDragX(v);
  };
  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const v = dragXRef.current;
    dragXRef.current = 0;
    if (Math.abs(v) > 80) decide(v > 0); else setDragX(0);
  };

  const progress  = Math.min(decisions.current.length, REQUIRED_SWIPES);
  const current   = deck[index];
  const next      = deck[index + 1];
  const rotation  = dragX * 0.08;
  const likeAlpha = Math.min(Math.max(dragX / 120, 0), 1);
  const nopeAlpha = Math.min(Math.max(-dragX / 120, 0), 1);

  // ════════════════════════════════════════════════════════════════
  // フェーズ1: フィルター選択
  // ════════════════════════════════════════════════════════════════
  if (phase === 'filter') {
    return (
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4 py-8 select-none">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-extrabold text-primary">STEP 1 / 2</span>
          </div>
          <h2 className="text-xl font-extrabold mb-2">好みの条件を教えてください</h2>
          <p className="text-sm text-foreground/60 leading-relaxed">
            この条件に近い女優を優先して表示します。<br />後からでも変更できます。
          </p>
        </div>

        {/* 体型 */}
        <div className="w-full mb-5">
          <h3 className="text-xs font-extrabold text-foreground/60 uppercase tracking-widest mb-3">① 体型の好み</h3>
          <div className="grid grid-cols-2 gap-2">
            {BODY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBodyFilter(opt.value)}
                className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                  bodyFilter === opt.value
                    ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                    : 'border-border bg-card text-foreground/70 hover:border-primary/40'
                }`}
              >
                <span className="text-lg mr-1.5">{opt.emoji}</span>{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 身長 */}
        <div className="w-full mb-5">
          <h3 className="text-xs font-extrabold text-foreground/60 uppercase tracking-widest mb-3">② 身長の好み</h3>
          <div className="grid grid-cols-3 gap-2">
            {HEIGHT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setHeightFilter(opt.value)}
                className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                  heightFilter === opt.value
                    ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                    : 'border-border bg-card text-foreground/70 hover:border-primary/40'
                }`}
              >
                <span className="text-base mr-1">{opt.emoji}</span>{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 年代 */}
        <div className="w-full mb-5">
          <h3 className="text-xs font-extrabold text-foreground/60 uppercase tracking-widest mb-3">③ 年代の好み</h3>
          <div className="grid grid-cols-2 gap-2">
            {AGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAgeFilter(opt.value)}
                className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                  ageFilter === opt.value
                    ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                    : 'border-border bg-card text-foreground/70 hover:border-primary/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 雰囲気 */}
        <div className="w-full mb-8">
          <h3 className="text-xs font-extrabold text-foreground/60 uppercase tracking-widest mb-3">④ 雰囲気・顔立ちの好み</h3>
          <div className="grid grid-cols-2 gap-2">
            {VIBE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setVibeFilter(opt.value)}
                className={`py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                  vibeFilter === opt.value
                    ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                    : 'border-border bg-card text-foreground/70 hover:border-primary/40'
                }`}
              >
                <span className="text-lg mr-1.5">{opt.emoji}</span>{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 開始ボタン */}
        <button
          onClick={() => setPhase('swipe')}
          className="w-full py-4 bg-primary text-white rounded-2xl font-extrabold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          スワイプ開始 →
        </button>
        <button onClick={onComplete} className="mt-3 text-xs text-foreground/40 underline font-bold hover:text-foreground/60">
          条件を決めずにスキップ
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // フェーズ2: スワイプ
  // ════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-foreground/60 font-bold">女優を読み込み中...</p>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in duration-300">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-lg font-extrabold">AIが好みを学習しています...</p>
        <p className="text-sm text-foreground/60">パーソナライズされたレコメンドを準備中です</p>
      </div>
    );
  }

  if (!current) {
    // デッキが空（API失敗）の場合のみエラー表示。カード使い切りは上のuseEffectが処理する
    if (deck.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <p className="text-foreground/60 text-sm">データを読み込めませんでした</p>
          <button onClick={loadDeck} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold">
            再読み込み
          </button>
          <button onClick={onComplete} className="text-xs text-foreground/40 underline font-bold">
            スキップしてダッシュボードへ
          </button>
        </div>
      );
    }
    // カードを全部消化中 → useEffectが保存処理中
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in duration-300">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-lg font-extrabold">AIが好みを学習しています...</p>
        <p className="text-sm text-foreground/60">パーソナライズされたレコメンドを準備中です</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4 py-6 select-none">
      {/* ヘッダー */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-extrabold text-primary">STEP 2 / 2 — AIが好みを学習します</span>
        </div>
        <h2 className="text-xl font-extrabold mb-1">好みの女優タイプは？</h2>
        <p className="text-sm text-foreground/60">
          右スワイプ or ❤️ で好き、左スワイプ or ✕ で興味なし
        </p>
      </div>

      {/* フィルターバッジ */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {bodyFilter !== 'all' && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold border border-primary/20">
            {bodyFilter}
          </span>
        )}
        {heightFilter !== 'all' && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold border border-primary/20">
            {heightFilter}
          </span>
        )}
        {ageFilter !== 'all' && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold border border-primary/20">
            {ageFilter}
          </span>
        )}
        {vibeFilter !== 'all' && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold border border-primary/20">
            {vibeFilter}
          </span>
        )}
        <button
          onClick={() => { setPhase('filter'); setIndex(0); decisions.current = []; dragXRef.current = 0; setDragX(0); }}
          className="text-[11px] text-foreground/40 underline font-bold"
        >
          条件を変更
        </button>
      </div>

      {/* プログレスバー */}
      <div className="w-full mb-5">
        <div className="flex justify-between text-[11px] text-foreground/50 font-bold mb-1.5">
          <span>好み学習</span>
          <span>{progress} / {REQUIRED_SWIPES}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(progress / REQUIRED_SWIPES) * 100}%` }}
          />
        </div>
      </div>

      {/* カードスタック */}
      <div className="relative w-full" style={{ height: '420px' }}>
        {next && (
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border border-border/50 shadow-sm"
            style={{ transform: 'scale(0.94) translateY(16px)', zIndex: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.imageUrl} alt={next.name} className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-70" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        <div
          ref={cardRef}
          className="absolute inset-0 rounded-3xl overflow-hidden border border-border/30 shadow-xl cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease',
            zIndex: 10,
            touchAction: 'none',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* ブラーバックドロップ：同じ画像をぼかして背景に敷き、メインは object-contain で自然サイズを維持 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-75 pointer-events-none"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={current.name}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

          <div className="absolute top-8 left-6 border-4 border-primary rounded-xl px-4 py-2 rotate-[-15deg]" style={{ opacity: likeAlpha }}>
            <span className="text-primary font-extrabold text-2xl tracking-widest">LIKE ❤️</span>
          </div>
          <div className="absolute top-8 right-6 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg]" style={{ opacity: nopeAlpha }}>
            <span className="text-red-400 font-extrabold text-2xl tracking-widest">PASS ✕</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
            <h3 className="text-xl font-extrabold mb-1.5 drop-shadow-lg">{current.name}</h3>
            <div className="flex flex-wrap gap-1.5">
              {current.tags.map(tag => (
                <span key={tag} className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-white/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center justify-center gap-5 mt-7">
        <button
          onClick={() => decide(false)}
          className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:scale-110 transition-all active:scale-95"
          aria-label="興味なし"
        >
          <X className="w-7 h-7 text-red-400" />
        </button>
        <button
          onClick={onComplete}
          className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-border transition-all"
          aria-label="スキップ"
        >
          <SkipForward className="w-4 h-4 text-foreground/50" />
        </button>
        <button
          onClick={() => decide(true)}
          className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg hover:border-primary hover:bg-primary/5 hover:scale-110 transition-all active:scale-95"
          aria-label="好き"
        >
          <Heart className="w-7 h-7 text-primary fill-current" />
        </button>
      </div>

      <p className="mt-4 text-[11px] text-foreground/40 font-bold hidden md:block">
        <ChevronLeft className="w-3 h-3 inline" /> キーボード矢印キーでも操作できます <ChevronRight className="w-3 h-3 inline" />
      </p>
    </div>
  );
}

// ── 好み保存（image_url・tags も送信）────────────────────────────────
async function savePreferences(
  decisions: { actress: SwipeDeckActress; liked: boolean }[],
  authToken?: string
) {
  const liked = decisions.filter(d => d.liked);
  if (!liked.length || !authToken) return;

  try {
    await fetch('/api/actress/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        likes: liked.map(d => ({
          actress_id:   d.actress.id,
          actress_name: d.actress.name,
          image_url:    d.actress.imageUrl,
          tags:         d.actress.tags,
        })),
      }),
    });
  } catch (e) {
    console.error('[SwipeOnboarding] savePreferences failed:', e);
  }
}
