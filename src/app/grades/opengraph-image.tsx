import { ImageResponse } from "next/og";
import { getGradeSnapshot } from "@/lib/grade-data";
import { letterColor, topGraded, TOP_GRADE_COUNT } from "@/lib/grade";

export const alt = "Top 20 Lightning node grades on ln.fyi";
export const revalidate = 86400;
export const maxDuration = 15;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const snapshot = await getGradeSnapshot();
  const top = snapshot
    ? topGraded(snapshot, Math.floor(Date.now() / 1000), 5)
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a0907",
          color: "#e8e1d1",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#aca99d",
          }}
        >
          <span>§ Top {TOP_GRADE_COUNT} report cards</span>
          <span>ln.fyi</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {top.length === 0 ? (
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
              Lightning node grades
            </div>
          ) : (
            top.map((row, index) => (
              <div
                key={row.node.publicKey}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 28,
                }}
              >
                <span style={{ fontSize: 22, color: "#56534a", width: 36 }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontSize: 54,
                    fontWeight: 700,
                    color: letterColor(row.grade.letter),
                    width: 120,
                    lineHeight: 1,
                  }}
                >
                  {row.grade.letter}
                </span>
                <span style={{ fontSize: 28, color: "#9c998f", width: 64 }}>
                  {row.grade.score}
                </span>
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: -1,
                  }}
                >
                  {(row.node.alias || "Anonymous").slice(0, 28)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#9c998f" }}>
          Capacity 30 · Channels 20 · Connectivity 30 · Age 20
        </div>
      </div>
    ),
    { ...size },
  );
}
