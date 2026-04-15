import Stripe from "stripe";

/**
 * Stripe サーバーサイドクライアント
 * STRIPE_SECRET_KEY 環境変数が必要。
 * 未設定時は null を返す（開発・プレビュー環境でのフォールバック）。
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/** VIP月額プランの価格ID（Stripe ダッシュボードで作成後に設定） */
export const VIP_PRICE_ID = process.env.STRIPE_VIP_PRICE_ID ?? "";

/** 決済成功・キャンセル後のリダイレクト先 */
export const CHECKOUT_SUCCESS_URL = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dostrike-ai.vercel.app"}/mypage?vip=success`;
export const CHECKOUT_CANCEL_URL  = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dostrike-ai.vercel.app"}/vip?canceled=1`;
