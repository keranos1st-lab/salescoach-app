import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "SalesCoach — контроль отдела продаж на основе данных";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadInter(weight: number) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  ).then((res) => res.text());

  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff2)'\)/);
  if (!match?.[1]) {
    throw new Error(`Failed to load Inter weight ${weight}`);
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

const badges = [
  "📊 Анализ звонков",
  "📋 Управленческие отчёты",
  "⚠️ Карта рисков",
] as const;

export default async function OpenGraphImage() {
  const [interBold, interRegular] = await Promise.all([
    loadInter(700),
    loadInter(400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          background: "linear-gradient(135deg, #0f3638 0%, #171614 72%)",
          color: "#ffffff",
          fontFamily: "Inter",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -200,
            top: 40,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(1, 105, 111, 0.12)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "#01696f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>SalesCoach</div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 1,
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1,
              maxWidth: 900,
            }}
          >
            Контроль отдела продаж
            <br />
            на основе данных
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 20,
              lineHeight: 1.4,
              color: "#4f98a3",
              maxWidth: 820,
            }}
          >
            Анализ звонков · Отчёты по менеджерам · Рекомендации руководителю
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            zIndex: 1,
          }}
        >
          {badges.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(1, 105, 111, 0.3)",
                fontSize: 16,
                fontWeight: 400,
                color: "#ffffff",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
