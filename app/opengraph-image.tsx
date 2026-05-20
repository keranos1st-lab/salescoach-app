import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SalesCoach — ИИ-анализ звонков для руководителей продаж";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#171614",
          color: "#f7f6f2",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#01696f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>SalesCoach</div>
        </div>
        <div
          style={{
            fontSize: 36,
            lineHeight: 1.35,
            color: "#d4d4d8",
            maxWidth: 900,
          }}
        >
          ИИ-анализ звонков для руководителей продаж
        </div>
        <div
          style={{
            marginTop: 40,
            height: 6,
            width: 120,
            borderRadius: 999,
            background: "#01696f",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
