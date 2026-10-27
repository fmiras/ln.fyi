import { ImageResponse } from "next/og";

export const alt = "Weekly Lightning Network movers on ln.fyi";
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
          background: "#0a0a09",
          color: "#eceae3",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#ff8a3d" }}>
          § WEEKLY MOVERS
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 0.92 }}>
            Who moved this week
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#9c998f", marginTop: 18 }}>
            Capacity, channels, and rank. Refreshed daily.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          <span>ln</span>
          <span style={{ color: "#ff8a3d" }}>.</span>
          <span>fyi</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
