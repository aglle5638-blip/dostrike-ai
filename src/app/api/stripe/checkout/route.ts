/**
 * POST /api/stripe/checkout
 * Stripe Checkout セッションを作成してURLを返す。
 * リクエストボディ: { priceId?: string }
 * レスポンス: { url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, VIP_PRICE_ID, CHECKOUT_SUCCESS_URL, CHECKOUT_CANCEL_URL } from "@/lib/stripe";
import { createAuthedClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // ── Stripe 未設定チェック ─────────────────────────────────────
    const stripe = getStripe();
    if (!stripe || !VIP_PRICE_ID) {
      return NextResponse.json(
        { error: "Stripe が設定されていません" },
        { status: 503 }
      );
    }

    // ── ユーザー認証 ─────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let userEmail: string | undefined;
    let userId: string | undefined;

    if (token) {
      const supabase = createAuthedClient(token);
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email;
        userId = user?.id;
      }
    }

    // ── Checkout セッション作成 ──────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: VIP_PRICE_ID, quantity: 1 }],
      success_url: CHECKOUT_SUCCESS_URL,
      cancel_url: CHECKOUT_CANCEL_URL,
      customer_email: userEmail,
      metadata: { userId: userId ?? "" },
      // 日本語UIに設定
      locale: "ja",
      // サブスクリプション設定
      subscription_data: {
        metadata: { userId: userId ?? "" },
      },
      // 支払い方法
      payment_method_types: ["card"],
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/stripe/checkout] error:", err);
    return NextResponse.json(
      { error: "チェックアウトセッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
