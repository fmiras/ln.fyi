"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number; label?: string };
export type FormatKind = "btc" | "number" | "compact-sats" | "raw";

function fmt(n: number, kind: FormatKind): string {
  switch (kind) {
    case "btc":
      return `${Math.round(n).toLocaleString("en-US")} BTC`;
    case "number":
      return Math.round(n).toLocaleString("en-US");
    case "compact-sats": {
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B sats";
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M sats";
      if (n >= 1e3) return (n / 1e3).toFixed(1) + "K sats";
      return `${Math.round(n)} sats`;
    }
    default:
      return n.toFixed(0);
  }
}

/**
 * Control-room area chart — fills its parent at real pixel dimensions.
 * Measures its container on mount + resize so text stays sharp and paths are never distorted.
 */
export function AreaChart({
  data,
  showAxis = true,
  compact = false,
  accent = "var(--amber)",
  format = "raw",
}: {
  data: Point[];
  showAxis?: boolean;
  compact?: boolean;
  accent?: string;
  format?: FormatKind;
}) {
  const formatVal = (n: number) => fmt(n, format);
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 800, h: 300 });
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({ w: Math.max(200, rect.width), h: Math.max(100, rect.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = box.w;
  const height = box.h;
  const pad = compact
    ? { top: 10, right: 12, bottom: showAxis ? 22 : 8, left: showAxis ? 46 : 8 }
    : { top: 16, right: 20, bottom: showAxis ? 28 : 12, left: showAxis ? 56 : 12 };

  const { path, area, scaled, minY, maxY, minX, maxX } = useMemo(() => {
    if (!data.length) {
      return { path: "", area: "", scaled: [], minY: 0, maxY: 0, minX: 0, maxX: 0 };
    }
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dy = maxY - minY || 1;
    const dx = maxX - minX || 1;
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const scaled = data.map((d) => ({
      x: pad.left + ((d.x - minX) / dx) * innerW,
      y: pad.top + (1 - (d.y - minY) / dy) * innerH,
      raw: d,
    }));
    const path = scaled
      .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
      .join(" ");
    const last = scaled[scaled.length - 1];
    const first = scaled[0];
    const area = `${path} L ${last.x},${height - pad.bottom} L ${first.x},${height - pad.bottom} Z`;
    return { path, area, scaled, minY, maxY, minX, maxX };
  }, [data, width, height, pad.top, pad.right, pad.bottom, pad.left]);

  const gridY = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const ratio = i / 4;
        return {
          y: pad.top + ratio * (height - pad.top - pad.bottom),
          value: maxY - ratio * (maxY - minY),
        };
      }),
    [pad.top, pad.bottom, height, maxY, minY],
  );

  const xTicks = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const ratio = i / 4;
        const t = minX + ratio * (maxX - minX);
        const x = pad.left + ratio * (width - pad.left - pad.right);
        return { x, t };
      }),
    [minX, maxX, pad.left, pad.right, width],
  );

  const hoverPoint = hover !== null ? scaled[hover] : null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {data.length > 0 && (
        <svg
          width={width}
          height={height}
          className="block"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const xRel = e.clientX - rect.left;
            let best = 0;
            let bestDist = Infinity;
            for (let i = 0; i < scaled.length; i++) {
              const d = Math.abs(scaled[i].x - xRel);
              if (d < bestDist) {
                bestDist = d;
                best = i;
              }
            }
            setHover(best);
          }}
        >
          <defs>
            <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="chart-grid">
            {gridY.map((g, i) => (
              <line
                key={i}
                x1={pad.left}
                x2={width - pad.right}
                y1={g.y}
                y2={g.y}
              />
            ))}
          </g>

          {showAxis &&
            gridY.map((g, i) => (
              <text
                key={`yl-${i}`}
                x={pad.left - 6}
                y={g.y + 3}
                textAnchor="end"
                fontFamily="var(--font-plex-mono), ui-monospace"
                fontSize={9}
                fill="var(--paper-faint)"
                style={{ letterSpacing: "0.04em" }}
              >
                {formatVal(g.value)}
              </text>
            ))}

          {showAxis &&
            xTicks.map((t, i) => (
              <text
                key={`xt-${i}`}
                x={t.x}
                y={height - pad.bottom + 14}
                textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
                fontFamily="var(--font-plex-mono), ui-monospace"
                fontSize={9}
                fill="var(--paper-faint)"
                style={{ letterSpacing: "0.04em" }}
              >
                {new Date(t.t * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })}
              </text>
            ))}

          <path d={area} fill={`url(#grad-${uid})`} />
          <path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hoverPoint && (
            <g>
              <line
                x1={hoverPoint.x}
                x2={hoverPoint.x}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke={accent}
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="3.5"
                fill="var(--ink)"
                stroke={accent}
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      )}

      {hoverPoint && (
        <div
          className="pointer-events-none absolute bg-panel border border-[color:var(--rule)] px-2.5 py-1.5 whitespace-nowrap z-10"
          style={{
            left: hoverPoint.x,
            top: hoverPoint.y,
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          <div className="mono-xs text-paper-faint">
            {new Date(hoverPoint.raw.x * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="mono tabular text-paper text-[11px] mt-0.5">
            {formatVal(hoverPoint.raw.y)}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sparkline — tiny inline trend line for stat cards.
 */
export function Sparkline({
  values,
  accent = "var(--amber)",
}: {
  values: number[];
  accent?: string;
}) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 28;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const dv = maxV - minV || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - minV) / dv) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Horizontal bar — ranked list rows.
 */
export function RankBar({
  value,
  max,
  accent = "var(--amber)",
}: {
  value: number;
  max: number;
  accent?: string;
}) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="h-[3px] bg-[color:var(--rule-2)] relative w-full">
      <div
        className="absolute top-0 left-0 h-full"
        style={{ width: `${pct}%`, background: accent }}
      />
    </div>
  );
}
