import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ドストライクAI – AIがあなたのドストライクを探し出す";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a0a0f 50%, #0f0f0f 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装飾：グロー */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,63,94,0.25) 0%, transparent 70%)",
            top: -100,
            right: -100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)",
            bottom: -80,
            left: -80,
          }}
        />

        {/* バッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(244,63,94,0.15)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 100,
            padding: "8px 20px",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f43f5e",
            }}
          />
          <span style={{ color: "#f43f5e", fontSize: 18, fontWeight: 700 }}>
            AI顔認証マッチング 稼働中
          </span>
        </div>

        {/* メインタイトル */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            あなたの
            <span style={{ color: "#f43f5e" }}>「ドストライク」</span>
            を
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            AIが探し出す
          </div>
        </div>

        {/* サブテキスト */}
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          顔写真を登録するだけ。AIが数万本の中からあなただけの作品をキュレーション
        </div>

        {/* フッター */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#f43f5e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 20, fontWeight: 900 }}>D</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 700 }}>
            dostrike-ai.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
