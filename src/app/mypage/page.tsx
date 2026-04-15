"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  CreditCard,
  Mail,
  Bell,
  Shield,
  ArrowLeft,
  LogOut,
  LogIn,
  Loader2,
  User,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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
  const { user, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm mb-8 flex items-center gap-6">
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 truncate">{displayName}</h2>
                {email && (
                  <p className="text-foreground/50 text-sm mb-2 truncate">{email}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-secondary text-foreground/70 px-3 py-1 rounded-full text-xs font-bold border border-border">
                    {providerLabel}
                  </span>
                  <span className="bg-secondary text-foreground/70 px-3 py-1 rounded-full text-xs font-bold border border-border">
                    無料プラン
                  </span>
                </div>
              </div>
            </div>

            {/* 設定グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4 hover:bg-secondary/50 cursor-pointer transition-colors group">
                <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">メールアドレス設定</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    ご登録のアドレス変更やパスワード再設定。
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4 opacity-50 cursor-not-allowed">
                <div className="bg-blue-500/10 p-3 rounded-full text-blue-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">支払い・プラン変更</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    準備中です。しばらくお待ちください。
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4 hover:bg-secondary/50 cursor-pointer transition-colors group">
                <div className="bg-purple-500/10 p-3 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">通知設定</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    AIおすすめ完了メールやキャンペーン通知の設定。
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4 hover:bg-secondary/50 cursor-pointer transition-colors group">
                <div className="bg-green-500/10 p-3 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">その他の設定</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    表示モードや年齢確認、その他の基本設定。
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl">
              <h3 className="font-extrabold text-red-500 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" /> Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-foreground/60 leading-relaxed flex-1">
                  アカウントを完全に削除します。この操作は取り消すことができず、AIへの学習データも全て消去されます。
                </p>
                <button className="whitespace-nowrap px-6 py-2.5 bg-background border border-red-500/50 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors">
                  退会手続きへ
                </button>
              </div>
            </div>

            {/* ログアウト */}
            <div className="mt-12 mb-8 flex justify-center">
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
