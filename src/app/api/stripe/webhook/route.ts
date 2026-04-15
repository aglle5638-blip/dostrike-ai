/**
 * POST /api/stripe/webhook
 * Stripe からの Webhook を受け取り、VIPステータスを更新する。
 *
 * Stripe CLI でローカルテスト:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *
 * Stripe ダッシュボードの Webhook エンドポイント:
 *   https://dostrike-ai.vercel.app/api/stripe/webhook
 *   イベント: customer.subscription.created, customer.subscription.updated,
 *             customer.subscription.deleted, checkout.session.completed
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Next.js はデフォルトでボディをパースするため、Webhook では無効にする必要がある
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe 未設定" }, { status: 503 });
  }

  // ── 署名検証 ─────────────────────────────────────────────────
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "署名なし" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] 署名検証失敗:", err);
    return NextResponse.json({ error: "署名検証失敗" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未設定" }, { status: 503 });
  }

  // ── イベント処理 ─────────────────────────────────────────────
  try {
    switch (event.type) {
      // サブスクリプション開始・更新
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const isActive = sub.status === "active" || sub.status === "trialing";
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        const expiresAt = isActive && periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await supabase
          .from("user_profiles")
          .upsert(
            { id: userId, is_vip: isActive, vip_expires_at: expiresAt, updated_at: new Date().toISOString() },
            { onConflict: "id" }
          );
        break;
      }

      // サブスクリプション解約
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await supabase
          .from("user_profiles")
          .update({ is_vip: false, vip_expires_at: null, updated_at: new Date().toISOString() })
          .eq("id", userId);
        break;
      }

      // Checkout 完了（初回購入確認）
      case "checkout.session.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        console.log("[webhook] checkout 完了:", session.id, "userId:", session.metadata?.userId);
        break;
      }

      default:
        // 未処理のイベントは無視
        break;
    }
  } catch (err) {
    console.error("[webhook] イベント処理エラー:", err);
    return NextResponse.json({ error: "処理エラー" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
