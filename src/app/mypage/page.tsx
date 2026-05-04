"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  LogOut,
  LogIn,
  Loader2,
  User,
  Heart,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────
type TopActress = {
  actress_id: string;
  actress_name: string;
  image_url?: string;
  score: number;
  tags?: string[];
};

type PreferenceAnalysis = {
  analysisText?: string;
  characteristics?: string[];
  topActresses: TopActress[];
};

// ─────────────────────────────────────────────
// アバター（Googleなどのアバター画像 or イニシャル）
// ─────────────────────────────────────────────
function Avatar({ user }: { user: { email?: string; user_metadata?: Record<string, string> } | null }) {
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name || user?.email || "?") as string;
  const initial = name.charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="w-20 h-20 rounded-full border-2 border-border shadow-inner object-cover"
      />
    );
  }

  return (
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-extrabold border-2 border-primary/20 shadow-inner text-primary">
      {initial}
    </div>
  );
}

// ─────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter();
  const { user, session, isLoading, signOut } = useAuth();

  const [swipeCount, setSwipeCount] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<PreferenceAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 退会モーダル
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "退会処理に失敗しました");
      }
      // サインアウトしてトップへ
      await signOut();
      router.push("/?deleted=1");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "退会処理に失敗しました");
      setDeleting(false);
    }
  };

  // モーダルを開くとき入力欄をフォーカス
  useEffect(() => {
    if (deleteModalOpen) {
      setDeleteInput("");
      setDeleteError(null);
      setTimeout(() => deleteInputRef.current?.focus(), 100);
    }
  }, [deleteModalOpen]);

  const loadStats = useCallback(async (token: string) => {
    // スワイプ数
    try {
      const res = await fetch("/api/actress/preferences/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { count: number };
        setSwipeCount(data.count);
      }
    } catch { /* ignore */ }

    // 好み分析
    if (!analysisLoading) {
      setAnalysisLoading(true);
      try {
        const res = await fetch("/api/actress/preferences/analysis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as PreferenceAnalysis;
          setAnalysis(data);
        }
      } catch { /* ignore */ } finally {
        setAnalysisLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      loadStats(session.access_token);
    }
  }, [session?.access_token, loadStats]);

  // プロバイダー情報
  const provider = user?.app_metadata?.provider as string | undefined;
  const providerLabel =
    provider === "google"
      ? "Googleアカウント"
      : provider === "apple"
      ? "Appleアカウント"
      : "ゲスト";

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "ゲストユーザー";

  const email = user?.email ?? "";

  const hasSwipes = swipeCount !== null && swipeCount > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="hidden sm:flex w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 md:px-8 py-3 items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-foreground font-extrabold text-lg hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> ホームに戻る
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8">
          マイページ
        </h1>

        {/* ローディング */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* 未ログイン */}
        {!isLoading && !user && (
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-5 mb-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-foreground/30" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">ログインしていません</h2>
              <p className="text-sm text-foreground/50">
                ログインするとキープ・いいねが保存され、<br />どのデバイスからでも確認できます。
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(244,63,94,0.3)]"
            >
              <LogIn className="w-4 h-4" />
              ログイン / アカウント作成
            </Link>
          </div>
        )}

        {/* ログイン済み */}
        {!isLoading && user && (
          <>
            {/* プロフィールカード */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm mb-6 flex items-center gap-6">
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 truncate">{displayName}</h2>
                {email && (
                  <p className="text-foreground/50 text-sm mb-2 truncate">{email}</p>
                )}
                <span className="bg-secondary text-foreground/70 px-3 py-1 rounded-full text-xs font-bold border border-border">
                  {providerLabel}
                </span>
              </div>
            </div>

            {/* ── スワイプ・好み統計 ── */}
            <section className="mb-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground/70 tracking-wide">あなたの好みデータ</h2>

              {/* スワイプ数バナー */}
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/50 mb-0.5">スワイプ済み女優数</p>
                  {swipeCount === null ? (
                    <div className="h-5 w-20 bg-secondary animate-pulse rounded" />
                  ) : (
                    <p className="text-xl font-extrabold">
                      {swipeCount.toLocaleString()}
                      <span className="text-sm font-normal text-foreground/50 ml-1">人</span>
                    </p>
                  )}
                </div>
                {!hasSwipes && swipeCount !== null && (
                  <Link
                    href="/dashboard"
                    className="whitespace-nowrap px-4 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition-colors"
                  >
                    スワイプを始める
                  </Link>
                )}
              </div>

              {/* 好み分析 */}
              {hasSwipes && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-accent/10 p-2 rounded-full text-accent flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm">AI好みタイプ分析</h3>
                  </div>

                  {analysisLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-secondary animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-secondary animate-pulse rounded w-2/3" />
                      <div className="h-4 bg-secondary animate-pulse rounded w-1/2" />
                    </div>
                  ) : analysis ? (
                    <div className="space-y-3">
                      {/* サマリー */}
                      {analysis.analysisText && (
                        <p className="text-sm leading-relaxed bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-foreground/80">
                          🤖 {analysis.analysisText}
                        </p>
                      )}

                      {/* 特徴リスト */}
                      {(analysis.characteristics?.length ?? 0) > 0 && (
                        <ul className="space-y-1.5">
                          {analysis.characteristics!.map((c, i) => (
                            <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-2">
                              <span className="text-primary flex-shrink-0 mt-0.5">▸</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* 好みの女優サムネイル */}
                      {analysis.topActresses && analysis.topActresses.length > 0 && (
                        <div>
                          <p className="text-[10px] text-foreground/40 mb-2 font-bold uppercase tracking-wide">好みの女優TOP</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {analysis.topActresses.slice(0, 8).map((a) => (
                              <div key={a.actress_id} className="flex-shrink-0 text-center">
                                {a.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={a.image_url}
                                    alt={a.actress_name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-lg">
                                    {a.actress_name.charAt(0)}
                                  </div>
                                )}
                                <p className="text-[9px] text-foreground/50 mt-1 w-14 truncate">{a.actress_name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/40">分析データを読み込めませんでした。</p>
                  )}
                </div>
              )}

              {/* キープ一覧へのリンク */}
              <Link
                href="/dashboard?mode=keep"
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-yellow-400/60 hover:bg-yellow-400/5 transition-all group"
              >
                <div className="bg-yellow-400/10 p-3 rounded-full text-yellow-500 flex-shrink-0 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-0.5">キープした動画</h3>
                  <p className="text-xs text-foreground/50">いいね・キープした作品の一覧を見る</p>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            </section>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl mb-4">
              <h3 className="font-extrabold text-red-500 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" /> Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-foreground/60 leading-relaxed flex-1">
                  アカウントを完全に削除します。この操作は取り消すことができず、AIへの学習データも全て消去されます。
                </p>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="whitespace-nowrap px-6 py-2.5 bg-background border border-red-500/50 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                >
                  退会手続きへ
                </button>
              </div>
            </div>

            {/* 退会確認モーダル */}
            {deleteModalOpen && (
              <div
                className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setDeleteModalOpen(false); }}
              >
                <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 p-2.5 rounded-full flex-shrink-0">
                      <Shield className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-lg font-extrabold text-red-500">退会手続き</h2>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-1.5 text-sm text-foreground/70 leading-relaxed">
                    <p>退会すると以下のデータが<strong className="text-red-500">完全かつ永久に削除</strong>されます：</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-foreground/60 mt-2">
                      <li>AIスワイプ学習データ（好みの女優情報）</li>
                      <li>キープ・いいね履歴</li>
                      <li>アカウント情報</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/60">
                      確認のため「<span className="text-red-500 font-extrabold">退会する</span>」と入力してください
                    </label>
                    <input
                      ref={deleteInputRef}
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="退会する"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60"
                    />
                  </div>

                  {deleteError && (
                    <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      {deleteError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModalOpen(false)}
                      disabled={deleting}
                      className="flex-1 py-2.5 bg-secondary border border-border rounded-xl font-bold text-sm hover:bg-border transition-colors disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== "退会する" || deleting}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />処理中…</>
                      ) : (
                        "退会する"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ログアウト */}
            <div className="mt-8 mb-8 flex justify-center">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-foreground/50 hover:text-foreground font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" /> ログアウト
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
