/**
 * GET  /api/slots  → ログインユーザーのスロット設定を返す
 * POST /api/slots  → スロット設定を保存する
 *
 * スロットは user_profiles.slot_ids (JSONB) に格納する。
 * 形式: ["A1", null, "B2", null, null] (長さ5固定)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAuthedClient } from "@/lib/supabase/server";

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

// ── GET: スロット取得 ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ slot_ids: [null, null, null, null, null] });

  const supabase = createAuthedClient(token);
  if (!supabase) return NextResponse.json({ slot_ids: [null, null, null, null, null] });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ slot_ids: [null, null, null, null, null] });

  const { data } = await supabase
    .from("user_profiles")
    .select("slot_ids")
    .eq("id", user.id)
    .single();

  const slot_ids: (string | null)[] = Array.isArray(data?.slot_ids)
    ? data.slot_ids
    : [null, null, null, null, null];

  return NextResponse.json({ slot_ids });
}

// ── POST: スロット保存 ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ ok: false, error: "未認証" }, { status: 401 });

  const supabase = createAuthedClient(token);
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase 未設定" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "未認証" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slot_ids: (string | null)[] = Array.isArray(body?.slot_ids) ? body.slot_ids : [];

  // 長さを 5 に揃える
  const normalized = Array.from({ length: 5 }, (_, i) => slot_ids[i] ?? null);

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      { id: user.id, slot_ids: normalized, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[/api/slots] upsert error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
