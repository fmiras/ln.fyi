import { ImageResponse } from "next/og";
import { api, safe, formatNumber, compactNumber } from "@/lib/api";
import { slugifyIsp } from "@/lib/seo";

export const alt = "Lightning Network hosting provider — ln.fyi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const ranked = (await safe(api.ispsRanked())) ?? [];
  const sorted = ranked.slice().sort((a, b) => b.capacity - a.capacity);
  const idx = sorted.findIndex((i) => slugifyIsp(i.name) === params.slug);
  const match = idx >= 0 ? sorted[idx] : null;
  const rank = idx >= 0 ? idx + 1 : null;

  const name = (match?.name ?? "Unknown").toUpperCase();
  const nodes = match ? formatNumber(match.nodes) : "—";
  const capacity = match ? compactNumber(match.capacity / 1e8) : "—";

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
            fontSize: 26,
            color: "#aca99d",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          § Hosting · {rank ? `Rank #${rank}` : "Unranked"}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 48, color: "#b9b2a2", lineHeight: 1 }}>
            Lightning Network on
          </div>
          <div
            style={{
              fontSize: name.length > 16 ? 96 : 120,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: 64 }}>
            <Stat label="NODES" value={nodes} />
            <Stat label="CAPACITY" value={`${capacity} BTC`} />
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            <span>ln</span>
            <span style={{ color: "#ff8a3d" }}>.</span>
            <span>fyi</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          fontSize: 20,
          color: "#aca99d",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: "#e8e1d1" }}>
        {value}
      </div>
    </div>
  );
}
