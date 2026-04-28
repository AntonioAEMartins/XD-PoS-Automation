import { ImageResponse } from "next/og";

export const alt = "XD-PoS — reverse-engineering a proprietary point-of-sale";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "88px 96px",
          background: "#0a0a0a",
          color: "#e5e5e5"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#a3a3a3"
          }}
        >
          <span>Case study</span>
          <span style={{ color: "#404040" }}>/</span>
          <span>antonioaemartins.dev</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.04,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              maxWidth: 980,
              color: "#e5e5e5"
            }}
          >
            Reverse-engineering a proprietary point-of-sale.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "#a3a3a3",
              maxWidth: 920
            }}
          >
            MITM capture, APK decompile, protocol synthesis, and a FastAPI
            agent that now closes bills from any phone at the table.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#a3a3a3"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: "#e5e5e5"
              }}
            />
            <span>xd-pos — Antônio A. E. Martins</span>
          </div>
          <span style={{ color: "#525252", letterSpacing: 4 }}>
            DISCOVERY · ARCHITECTURE · DEMO
          </span>
        </div>
      </div>
    ),
    size
  );
}
