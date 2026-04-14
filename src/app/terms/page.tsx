import Link from "next/link";
import { FileText, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | ドストライクAI",
  description: "ドストライクAIの利用規約です。",
};

const SECTIONS = [
  {
    title: "第1条（サービスについて）",
    content: `ドストライクAI（以下「本サービス」）は、AIを活用した動画コンテンツのキュレーション・推薦を行うウェブサービスです。本サービスは、株式会社デジタルコマース（DMM.com）が運営するFANZAのアフィリエイトプログラムを利用しており、本サービスを通じてリンク先の商品が購入された場合、運営者が報酬を受け取る場合があります。`,
  },
  {
    title: "第2条（年齢制限）",
    content: `本サービスは成人向けコンテンツを扱います。18歳未満の方のご利用は固くお断りしております。本サービスにアクセスした時点で、お客様は18歳以上であることを表明・保証したものとみなします。18歳未満の方が利用していることが判明した場合、直ちにアクセスを停止する場合があります。`,
  },
  {
    title: "第3条（禁止事項）",
    content: `利用者は以下の行為を行ってはなりません。\n\n・18歳未満の方への本サービスの紹介・共有\n・本サービスのコンテンツの無断複製・転載・二次利用\n・本サービスのシステムへの不正アクセスや妨害行為\n・他の利用者または第三者の権利を侵害する行為\n・法令または公序良俗に反する行為\n・その他、運営者が不適切と判断する行為`,
  },
  {
    title: "第4条（アフィリエイトリンクについて）",
    content: `本サービスに掲載されている動画・商品リンクの一部はアフィリエイトリンクです。利用者がリンク先で商品を購入した場合、本サービスの運営者はアフィリエイト報酬を受け取ることがあります。掲載コンテンツの選定にあたっては公正を期しておりますが、アフィリエイト報酬の有無が掲載順位・推薦結果に影響する場合があります。`,
  },
  {
    title: "第5条（免責事項）",
    content: `運営者は以下について一切の責任を負いません。\n\n・本サービスを通じてアクセスした外部サービス（FANZA等）で生じたトラブル\n・本サービスの利用により生じた損害（直接・間接を問わず）\n・天災・システム障害等の不可抗力による本サービスの停止\n・外部サービスのコンテンツの正確性・合法性\n\n本サービスは現状有姿で提供されており、特定目的への適合性について保証しません。`,
  },
  {
    title: "第6条（知的財産権）",
    content: `本サービスのデザイン・ロゴ・AIシステム・プログラムコード等に関する知的財産権は、運営者に帰属します。本サービスに掲載されているFANZA等の商品画像・タイトル等の著作権は各権利者に帰属します。利用者は運営者の事前の書面による許可なく、本サービスのコンテンツを複製・改変・転用することができません。`,
  },
  {
    title: "第7条（プライバシー）",
    content: `本サービスにおける個人情報の取り扱いについては、別途定める「プライバシーポリシー」に従います。本サービスは利用者の行動データ（閲覧履歴・フィードバック等）をAIの学習・推薦精度向上に利用します。`,
  },
  {
    title: "第8条（サービスの変更・終了）",
    content: `運営者は、利用者への事前通知なく、本サービスの内容変更・一時停止・終了を行う場合があります。これにより利用者に損害が生じた場合であっても、運営者は一切の責任を負いません。`,
  },
  {
    title: "第9条（利用規約の変更）",
    content: `運営者は必要に応じて本規約を変更する場合があります。変更後の規約はサービス上に掲載した時点から効力を生じます。変更後も本サービスを継続して利用した場合、改定後の規約に同意したものとみなします。`,
  },
  {
    title: "第10条（準拠法・管轄）",
    content: `本規約は日本法を準拠法とします。本サービスに関して生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`,
  },
];

export default function TermsPage() {
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
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="font-extrabold text-base">利用規約</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* タイトル */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            ドストライクAI 利用規約
          </h2>
          <p className="text-sm text-foreground/50">
            最終更新日：2026年4月14日
          </p>
        </div>

        {/* 前文 */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8">
          <p className="text-sm text-foreground/70 leading-relaxed">
            本利用規約（以下「本規約」）は、ドストライクAI（以下「運営者」）が提供するサービス（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用になる前に、必ず本規約をお読みください。本サービスを利用した時点で、本規約に同意したものとみなします。
          </p>
        </div>

        {/* 各条文 */}
        <div className="space-y-6">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-extrabold text-sm text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
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
            <Link href="/privacy" className="text-primary hover:underline">
              プライバシーポリシー
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
