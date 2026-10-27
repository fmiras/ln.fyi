import { ImageResponse } from "next/og";
import { formatNumber, formatSats } from "./api";
import { gradeTone } from "./grade";
import { loadNodeGrade } from "./node-report";

const WIDTH = 1200;
const HEIGHT = 630;

const TONE_HEX = {
  good: "#7fd8a4",
  paper: "#eceae3",
  amber: "#ff8a3d",
  bad: "#ff6b6b",
} as const;

export async function nodeCardImage(pubkey: string) {
  let alias = "LIGHTNING NODE";
  let letter = "—";
  let score = "—";
  let subtitle = "Directory data unavailable";
  let tone: string = TONE_HEX.paper;
  let factors: { label: string; score: number }[] = [];

  try {
    const loaded = await loadNodeGrade(pubkey);
    if (loaded.status === "ready") {
      const node = loaded.profile.node;
      alias = (node.alias || "ANONYMOUS").toUpperCase().slice(0, 28);
      letter = loaded.grade.letter;
      score = String(loaded.grade.score);
      subtitle = `${formatSats(node.capacity)} BTC · ${formatNumber(node.active_channel_count)} channels`;
      tone = TONE_HEX[gradeTone(loaded.grade.letter)];
      factors = loaded.grade.factors.map((factor) => ({
        label: factor.label.toUpperCase(),
        score: factor.score,
      }));
    }
  } catch {
    // A failed directory read still returns a card image, not a 500.
  }

  const aliasSize = alias.length > 16 ? 52 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a09",
          color: "#eceae3",
          fontFamily: "sans-serif",
          padding: "52px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 320,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: 4,
              color: "#ff8a3d",
            }}
          >
            § NODE REPORT
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: letter.length > 2 ? 108 : 150,
                fontWeight: 700,
                letterSpacing: -6,
                lineHeight: 0.85,
                color: tone,
              }}
            >
              {letter}
            </div>
            <div style={{ display: "flex", fontSize: 32, marginTop: 16, color: "#eceae3" }}>
              {score} / 100
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            <span>ln</span>
            <span style={{ color: "#ff8a3d" }}>.</span>
            <span>fyi</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 740,
            marginLeft: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: aliasSize,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 0.95,
            }}
          >
            {alias}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#9c998f", marginTop: 12 }}>
            {subtitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
            {factors.map((factor) => (
              <div
                key={factor.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 46,
                }}
              >
                <div style={{ width: 190, fontSize: 16, letterSpacing: 2, color: "#9c998f" }}>
                  {factor.label}
                </div>
                <div
                  style={{
                    width: 430,
                    height: 8,
                    background: "#24231f",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: Math.max(4, Math.round((factor.score / 100) * 430)),
                      height: 8,
                      background: "#ff8a3d",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 80,
                    display: "flex",
                    justifyContent: "flex-end",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {factor.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
