import { ImageResponse } from "next/og";
import { api, safe, formatSats, formatNumber } from "@/lib/api";

export const alt = "Lightning Node profile on ln.fyi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { pubkey: string };
}) {
  const node = await safe(api.node(params.pubkey));

  const alias = (node?.alias || "ANONYMOUS").toUpperCase().slice(0, 32);
  const capacity = node ? formatSats(node.capacity) : "—";
  const channels = node ? formatNumber(node.active_channel_count) : "—";
  const country =
    node?.country && typeof node.country === "object"
      ? (node.country as { en?: string }).en || ""
      : "";
  const isp = node?.as_organization || "";
  const colorRaw = node?.color;
  const accent =
    colorRaw && /^#[0-9a-f]{6}$/i.test(colorRaw) ? colorRaw : "#ff8a3d";

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
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 26,
            color: "#aca99d",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              background: accent,
            }}
          />
          <span>§ Lightning Node Profile</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: alias.length > 16 ? 110 : 140,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {alias}
          </div>
          {(country || isp) && (
            <div style={{ fontSize: 32, color: "#b9b2a2" }}>
              {[country, isp].filter(Boolean).join(" · ")}
            </div>
          )}
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
            <Stat label="CAPACITY" value={`₿ ${capacity}`} />
            <Stat label="CHANNELS" value={channels} />
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
      <div style={{ fontSize: 52, fontWeight: 700, color: "#e8e1d1" }}>
        {value}
      </div>
    </div>
  );
}
