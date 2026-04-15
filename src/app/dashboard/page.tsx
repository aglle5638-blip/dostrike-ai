import { Suspense } from 'react';
import DashboardPage from './DashboardPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AIマッチ ダッシュボード",
  description: "あなたの好みに合わせたAI推薦動画を確認できます。",
  robots: { index: false, follow: false },
};

/**
 * Next.js 本番ビルド要件:
 * useSearchParams() を使うクライアントコンポーネントは
 * Suspense で囲む必要がある。
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
