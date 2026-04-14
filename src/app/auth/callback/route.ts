import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * OAuth コールバックハンドラ
 * Google / Apple からのリダイレクトを受け取り、セッションを確立する。
 * Supabase ダッシュボードの "Redirect URLs" に
 * https://dostrike-ai.vercel.app/auth/callback を追加すること。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // OAuth 成功後の遷移先（デフォルト: /dashboard）
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 認証失敗 → エラーパラメータ付きでログイン画面へ
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
