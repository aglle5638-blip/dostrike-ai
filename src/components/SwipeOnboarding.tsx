'use client';

/**
 * SwipeOnboarding
 *
 * 女優カードを左右にスワイプ（またはボタン操作）して
 * 好みを学習するオンボーディングUI。
 *
 * - タッチ操作（スマホ）: 左右スワイプ
 * - マウス操作（PC）   : ドラッグ or ←/→ボタン
 * - キーボード         : ← → キー
 *
 * 10枚判定後、user_actress_preferences に保存して onComplete() を呼ぶ。
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, X, ChevronLeft, ChevronRight, Sparkles, SkipForward } from 'lucide-react';
import type { SwipeDeckActress } from '@/app/api/actress/swipe-deck/route';

interface Props {
  /** スワイプ完了後に呼ばれるコールバック */
  onComplete: () => void;
  /** Supabase Auth トークン（ログイン時のみ渡す） */
  authToken?: string;
}

const REQUIRED_SWIPES = 10;

export default function SwipeOnboarding({ onComplete, authToken }: Props) {
  const [deck, setDeck]           = useState<SwipeDeckActress[]>([]);
  const [index, setIndex]         = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);

  // ドラッグ状態
  const [dragX, setDragX]         = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const cardRef    = useRef<HTMLDivElement>(null);

  // 判定履歴（ liked = true / false）
  const decisions = useRef<{ actress: SwipeDeckActress; liked: boolean }[]>([]);

  // デッキ取得
  useEffect(() => {
    fetch('/api/actress/swipe-deck')
      .then(r => r.json())
      .then((d: { actresses: SwipeDeckActress[] }) => {
        setDeck(d.actresses);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── 判定処理 ────────────────────────────────────────────────────
  const decide = useCallback(async (liked: boolean) => {
    if (index >= deck.length || isSaving) return;

    const actress = deck[index];
    decisions.current.push({ actress, liked });
    const newIndex = index + 1;
    setIndex(newIndex);
    setDragX(0);

    // REQUIRED_SWIPES 枚に達したら保存
    if (decisions.current.length >= REQUIRED_SWIPES) {
      setIsSaving(true);
      await savePreferences(decisions.current, authToken);
      onComplete();
    }
  }, [index, deck, isSaving, authToken, onComplete]);

  // キーボード操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide(true);
      if (e.key === 'ArrowLeft')  decide(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [decide]);

  // ── タッチ操作 ──────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setDragX(e.touches[0].clientX - dragStartX.current);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > 80) {
      decide(dragX > 0);
    } else {
      setDragX(0);
    }
  };

  // ── マウス操作 ──────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - dragStartX.current);
  };
  const onMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragX) > 80) {
      decide(dragX > 0);
    } else {
      setDragX(0);
    }
  };

  // ── レンダリング ────────────────────────────────────────────────
  const progress  = Math.min(decisions.current.length, REQUIRED_SWIPES);
  const current   = deck[index];
  const next      = deck[index + 1];

  // カードのスタイル（ドラッグ中の傾き）
  const rotation  = dragX * 0.08;
  const likeAlpha = Math.min(Math.max(dragX / 120, 0), 1);
  const nopeAlpha = Math.min(Math.max(-dragX / 120, 0), 1);

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
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <p className="text-foreground/60 text-sm">データを読み込めませんでした</p>
        <button onClick={onComplete} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold">
          スキップしてダッシュボードへ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4 py-6 select-none">

      {/* ヘッダー */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-extrabold text-primary">AIが好みを学習します</span>
        </div>
        <h2 className="text-xl font-extrabold mb-1">好みの女優タイプは？</h2>
        <p className="text-sm text-foreground/60">
          右スワイプ or ❤️ で好き、左スワイプ or ✕ で興味なし
        </p>
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

        {/* 次のカード（背景に薄く） */}
        {next && (
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border border-border/50 shadow-sm"
            style={{ transform: 'scale(0.94) translateY(16px)', zIndex: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.imageUrl} alt={next.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        {/* 現在のカード */}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={current.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* グラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* 好き表示（右スワイプ） */}
          <div
            className="absolute top-8 left-6 border-4 border-primary rounded-xl px-4 py-2 rotate-[-15deg]"
            style={{ opacity: likeAlpha }}
          >
            <span className="text-primary font-extrabold text-2xl tracking-widest">LIKE ❤️</span>
          </div>

          {/* 興味なし表示（左スワイプ） */}
          <div
            className="absolute top-8 right-6 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg]"
            style={{ opacity: nopeAlpha }}
          >
            <span className="text-red-400 font-extrabold text-2xl tracking-widest">PASS ✕</span>
          </div>

          {/* 女優情報 */}
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
        {/* 興味なし */}
        <button
          onClick={() => decide(false)}
          className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:scale-110 transition-all active:scale-95"
          aria-label="興味なし"
        >
          <X className="w-7 h-7 text-red-400" />
        </button>

        {/* スキップ */}
        <button
          onClick={onComplete}
          className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-border transition-all"
          aria-label="スキップ"
          title="スキップしてダッシュボードへ"
        >
          <SkipForward className="w-4 h-4 text-foreground/50" />
        </button>

        {/* 好き */}
        <button
          onClick={() => decide(true)}
          className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg hover:border-primary hover:bg-primary/5 hover:scale-110 transition-all active:scale-95"
          aria-label="好き"
        >
          <Heart className="w-7 h-7 text-primary fill-current" />
        </button>
      </div>

      {/* PC向けキーボードヒント */}
      <p className="mt-4 text-[11px] text-foreground/40 font-bold hidden md:block">
        <ChevronLeft className="w-3 h-3 inline" /> キーボード矢印キーでも操作できます <ChevronRight className="w-3 h-3 inline" />
      </p>
    </div>
  );
}

// ── 好み保存 ─────────────────────────────────────────────────────────
async function savePreferences(
  decisions: { actress: SwipeDeckActress; liked: boolean }[],
  authToken?: string
) {
  const liked = decisions.filter(d => d.liked);
  if (!liked.length || !authToken) return;

  // /api/videos/feedback の仕組みを流用せず、直接 Supabase を使えないため
  // 専用エンドポイントを呼ぶ
  try {
    await fetch('/api/actress/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        likes: liked.map(d => ({ actress_id: d.actress.id, actress_name: d.actress.name })),
      }),
    });
  } catch (e) {
    console.error('[SwipeOnboarding] savePreferences failed:', e);
  }
}
