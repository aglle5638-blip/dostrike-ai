import Link from "next/link";
import { Shield, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | ドストライクAI",
  description: "ドストライクAIのプライバシーポリシーです。",
};

const SECTIONS = [
  {
    title: "1. 取得する情報",
    content: `本サービスでは、以下の情報を取得する場合があります。\n\n【自動的に取得する情報】\n・アクセスログ（IPアドレス、ブラウザ種別、アクセス日時、参照URL）\n・Cookieおよびローカルストレージのデータ（年齢確認の確認状況、好みのタイプ設定）\n・デバイス情報（OS、画面解像度等）\n\n【利用者が提供する情報】\n・アカウント登録時のメールアドレス（Google認証を利用した場合）\n・本サービス上での行動データ（フィードバック、保存リスト等）`,
  },
  {
    title: "2. 情報の利用目的",
    content: `取得した情報は以下の目的で利用します。\n\n・AIによる動画推薦精度の向上\n・本サービスの品質改善・不具合対応\n・利用状況の統計分析（個人を特定しない形式）\n・不正アクセス・不正利用の防止\n・法令または利用規約への違反行為への対応\n・サービスに関するお知らせの送信（登録ユーザーのみ）`,
  },
  {
    title: "3. Cookieの利用について",
    content: `本サービスでは以下の目的でCookieを使用します。\n\n・年齢確認の結果を記録（30日間）\n・ログイン状態の維持\n・利用者の設定・好みの保存\n・アクセス解析（Google Analytics）\n\nブラウザの設定によりCookieを無効にすることができますが、その場合一部機能が正常に動作しない場合があります。`,
  },
  {
    title: "4. 第三者への提供",
    content: `運営者は、以下の場合を除き、取得した個人情報を第三者に提供しません。\n\n・利用者本人の同意がある場合\n・法令に基づく開示要求がある場合\n・人の生命・財産の保護のために必要な場合\n・公衆衛生・児童の健全育成のために必要な場合`,
  },
  {
    title: "5. 第三者サービスの利用",
    content: `本サービスでは以下の第三者サービスを利用しています。各サービスのプライバシーポリシーについては、それぞれの提供元をご確認ください。\n\n・Google Analytics（アクセス解析）\n  https://policies.google.com/privacy\n\n・Supabase（データベース・認証）\n  https://supabase.com/privacy\n\n・FANZA アフィリエイト（動画コンテンツ連携）\n  https://www.dmm.co.jp/company/privacy/\n\n・Vercel（ホスティング）\n  https://vercel.com/legal/privacy-policy\n\n・Google Gemini API（AI機能）\n  https://policies.google.com/privacy`,
  },
  {
    title: "6. データの保存期間",
    content: `・アクセスログ：最大90日間\n・Cookieデータ：設定に応じた有効期限まで\n・アカウントデータ：退会から30日後に削除\n・フィードバックデータ：サービス提供に必要な期間\n\nアカウントの削除をご希望の場合は、マイページまたは問い合わせ窓口よりお申し出ください。`,
  },
  {
    title: "7. セキュリティ",
    content: `運営者は、取得した情報の漏洩・滅失・毀損を防ぐため、適切なセキュリティ対策を実施しています。ただし、インターネット上での完全なセキュリティを保証するものではありません。\n\n・通信のSSL/TLS暗号化\n・データベースへのアクセス制限\n・定期的なセキュリティ監査`,
  },
  {
    title: "8. 未成年者のプライバシー",
    content: `本サービスは18歳以上を対象としており、18歳未満の方の個人情報を意図的に収集しません。18歳未満の方の情報を収集していることが判明した場合、速やかに当該情報を削除します。保護者の方で、お子様が本サービスを利用している可能性がある場合は、お問い合わせください。`,
  },
  {
    title: "9. 利用者の権利",
    content: `利用者は自己の個人情報に関して以下の権利を有します。\n\n・開示請求：保有する個人情報の開示を求める権利\n・訂正請求：不正確な情報の訂正を求める権利\n・削除請求：個人情報の削除を求める権利\n・利用停止請求：個人情報の利用停止を求める権利\n\nこれらのご要望は、下記お問い合わせ先よりご連絡ください。本人確認の上、合理的な期間内に対応します。`,
  },
  {
    title: "10. プライバシーポリシーの変更",
    content: `運営者は、法令の変更やサービス内容の変更に応じて本ポリシーを改定する場合があります。重要な変更がある場合は、サービス上での告知または登録メールアドレスへの通知を行います。改定後も本サービスを継続して利用した場合、改定後のポリシーに同意したものとみなします。`,
  },
  {
    title: "11. お問い合わせ",
    content: `個人情報の取り扱いに関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。\n\n運営者：ドストライクAI 運営事務局\nサービスURL：https://dostrike-ai.vercel.app`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-secondary transition-colors text-foreground/60 hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-extrabold text-base">プライバシーポリシー</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* タイトル */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            プライバシーポリシー
          </h2>
          <p className="text-sm text-foreground/50">
            最終更新日：2026年4月14日
          </p>
        </div>

        {/* 前文 */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8">
          <p className="text-sm text-foreground/70 leading-relaxed">
            ドストライクAI（以下「運営者」）は、利用者のプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーでは、本サービスにおける個人情報の取り扱いについて説明します。
          </p>
        </div>

        {/* 各セクション */}
        <div className="space-y-5">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-extrabold text-sm text-foreground mb-3">
                {section.title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="mt-10 pt-6 border-t border-border/50 text-center space-y-3">
          <p className="text-xs text-foreground/40">
            ドストライクAI 運営事務局
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/terms" className="text-primary hover:underline">
              利用規約
            </Link>
            <span className="text-foreground/30">|</span>
            <Link href="/" className="text-foreground/50 hover:text-foreground">
              トップページへ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
