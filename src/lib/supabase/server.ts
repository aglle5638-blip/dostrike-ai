/**
 * サーバーサイド Supabase クライアント
 * Next.js API Routes / Server Components で使用する。
 * （ブラウザでは src/lib/supabase/client.ts を使う）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * サービスロールキー（RLS バイパス）を使うサーバー専用クライアント。
 * 絶対にクライアント側には露出させないこと。
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Supabase 未設定時は null を返す。呼び出し側でフォールバック処理すること。
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * 匿名キー（RLS 適用）を使うサーバークライアント。
 * 一般的な API Route で使用する。
 */
export function createAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * ユーザーのアクセストークンを Authorization ヘッダーに付与したクライアント。
 * RLS が auth.uid() ベースで正しく機能する。
 */
export function createAuthedClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(url, key, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
