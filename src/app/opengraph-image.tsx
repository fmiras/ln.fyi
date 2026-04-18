import { ImageResponse } from "next/og";

export const alt = "ln.fyi — An editorial atlas of the Lightning Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a0907",
          color: "#e8e1d1",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#aca99d",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          § Lightning Network · Control
        </div>
        <div
          style={{
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: -8,
            lineHeight: 1,
            display: "flex",
          }}
        >
          <span>ln</span>
          <span style={{ color: "#ff8a3d" }}>.</span>
          <span>fyi</span>
        </div>
        <div
          style={{
            fontSize: 42,
            color: "#e8e1d1",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          An editorial atlas of the Bitcoin Lightning Network.
        </div>
      </div>
    ),
    { ...size },
  );
}
