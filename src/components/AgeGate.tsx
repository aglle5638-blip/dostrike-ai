"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle } from "lucide-react";

const COOKIE_KEY = "age_verified";
const COOKIE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AgeGate() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Cookie確認（SSR回避のためuseEffect内）
    if (!getCookie(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleEnter = () => {
    setCookie(COOKIE_KEY, "1", COOKIE_DAYS);
    setLeaving(true);
    setTimeout(() => setVisible(false), 400);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.co.jp";
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-5 transition-opacity duration-400 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* カード */}
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300">

        {/* ヘッダー */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center border-b border-border/30">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            ドストライク<span className="text-primary">AI</span>
          </h1>
          <p className="text-[11px] text-foreground/50 mt-1 font-medium">
            年齢確認が必要です
          </p>
        </div>

        {/* 本文 */}
        <div className="px-6 py-6 space-y-4">
          {/* 警告 */}
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200/80 rounded-2xl p-3.5">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-yellow-800 font-medium leading-relaxed">
              このサイトは<strong>成人向けコンテンツ</strong>を含みます。
              18歳未満の方のアクセスは固くお断りしております。
            </p>
          </div>

          {/* 質問 */}
          <p className="text-center text-sm font-bold text-foreground/80">
            あなたは<span className="text-primary">18歳以上</span>ですか？
          </p>

          {/* ボタン */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleEnter}
              className="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(244,63,94,0.4)]"
            >
              ✅ 18歳以上です（入場する）
            </button>
            <button
              onClick={handleExit}
              className="w-full py-3 bg-secondary text-foreground/60 font-bold rounded-2xl text-sm hover:bg-border transition-all border border-border"
            >
              ❌ 18歳未満です（退場する）
            </button>
          </div>

          {/* 注意書き */}
          <p className="text-[10px] text-foreground/40 text-center leading-relaxed">
            入場することで
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground/60">
              利用規約
            </a>
            および
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground/60">
              プライバシーポリシー
            </a>
            に同意したものとみなします。
            確認結果は{COOKIE_DAYS}日間記憶されます。
          </p>
        </div>
      </div>
    </div>
  );
}
