import { ImageResponse } from "next/og";

export const alt = "Better Every Day — a private toolkit for thinking through a real decision";
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
          justifyContent: "space-between",
          backgroundColor: "#FAFAF8",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            width: 120,
            height: 8,
            backgroundColor: "#92400E",
            borderRadius: 4,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#1C1917",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Better Every Day.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              color: "#78716C",
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            A private toolkit for thinking through a real decision — nothing you
            enter ever leaves your browser.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#92400E" }}>
          bettereveryday.vercel.app
        </div>
      </div>
    ),
    size
  );
}
