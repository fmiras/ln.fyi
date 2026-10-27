import { ImageResponse } from "next/og";
import { getGradeSnapshot } from "@/lib/grade-data";
import { gradeStamp, letterColor, topGraded, TOP_GRADE_COUNT } from "@/lib/grade";

export const alt = "Top 20 Lightning node grades on ln.fyi";
export const revalidate = 86400;
export const maxDuration = 15;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0907";
const PAPER = "#eceae3";
const DIM = "#9c998f";

export default async function Image() {
  const snapshot = await getGradeSnapshot();
  const now = Math.floor(Date.now() / 1000);
  const ranked = snapshot ? topGraded(snapshot, now, TOP_GRADE_COUNT) : [];
  const rows = ranked.slice(0, 10);
  const more = ranked.length - rows.length;
  const stamp = snapshot ? gradeStamp(snapshot.asOf) : "Daily snapshot";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "36px 48px",
          background: INK,
          color: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 3,
            color: DIM,
          }}
        >
          <span>TOP {TOP_GRADE_COUNT} REPORT CARDS</span>
          <span style={{ color: PAPER, fontWeight: 700, letterSpacing: 0 }}>ln.fyi</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.length === 0 ? (
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>Lightning node grades</div>
          ) : (
            rows.map((row, index) => (
              <div
                key={row.node.publicKey}
                style={{ display: "flex", alignItems: "baseline", gap: 18 }}
              >
                <span style={{ width: 36, fontSize: 20, color: DIM }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span style={{ width: 64, fontSize: 32, fontWeight: 700 }}>{row.grade.score}</span>
                <span
                  style={{
                    width: 64,
                    fontSize: 22,
                    fontWeight: 700,
                    color: letterColor(row.grade.letter),
                  }}
                >
                  {row.grade.letter}
                </span>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
                  {(row.node.alias || "Anonymous").slice(0, 32)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: DIM }}>
          <span>{stamp}</span>
          <span>{more > 0 ? `and ${more} more` : " "}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
