import { ImageResponse } from "next/og";
import { api, safe, formatSats, formatNumber } from "@/lib/api";
import { getGradeSnapshot } from "@/lib/grade-data";
import {
  gradeForNode,
  gradeStamp,
  heldBackLine,
  isModestGrade,
  letterColor,
  publicStanding,
  standingLine,
  strengthLine,
  subjectFromProfile,
  type GradeFactor,
  type NodeGrade,
  type PublicStanding,
} from "@/lib/grade";

export const alt = "Lightning node grade on ln.fyi";
export const revalidate = 86400;
export const maxDuration = 15;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0907";
const PAPER = "#eceae3";
const DIM = "#9c998f";
const RULE = "#35332c";
const AMBER = "#ff8a3d";

export default async function Image({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  const [node, snapshot] = await Promise.all([
    safe(api.node(pubkey)),
    getGradeSnapshot(),
  ]);
  const now = Math.floor(Date.now() / 1000);
  const alias = (node?.alias || "ANONYMOUS").toUpperCase().slice(0, 28);
  const country =
    node?.country && typeof node.country === "object"
      ? (node.country as { en?: string }).en || ""
      : "";
  const isp = node?.as_organization || "";
  const place = [country, isp].filter(Boolean).join(" · ") || "Location unlisted";
  const subject =
    node && snapshot
      ? subjectFromProfile(
          {
            publicKey: (node.public_key || pubkey).toLowerCase(),
            capacity: node.capacity,
            channels: node.active_channel_count,
            firstSeen: node.first_seen,
          },
          snapshot,
        )
      : null;
  const capacity = subject
    ? formatSats(subject.capacity)
    : node
      ? formatSats(node.capacity)
      : "—";
  const channels = subject
    ? formatNumber(subject.channels)
    : node
      ? formatNumber(node.active_channel_count)
      : "—";
  const grade =
    node && snapshot
      ? gradeForNode(
          {
            publicKey: (node.public_key || pubkey).toLowerCase(),
            capacity: node.capacity,
            channels: node.active_channel_count,
            firstSeen: node.first_seen,
          },
          snapshot,
          now,
        )
      : null;
  const standing =
    grade && snapshot
      ? publicStanding(node?.public_key || pubkey, grade.score, snapshot, now)
      : null;
  const strength = grade ? strengthLine(grade, snapshot?.nodeCount ?? 0) : null;
  const stamp = snapshot ? gradeStamp(snapshot.asOf) : "ln.fyi";
  const modest = grade ? isModestGrade(grade.letter) : false;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 52px 36px",
          background: INK,
          color: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        {grade && modest && strength ? (
          <Modest
            alias={alias}
            place={place}
            capacity={capacity}
            channels={channels}
            grade={grade}
            lead={strength}
          />
        ) : (
          <Hero
            alias={alias}
            place={place}
            capacity={capacity}
            channels={channels}
            grade={grade}
            standing={standing}
            badge={Boolean(grade && modest)}
          />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: DIM,
          }}
        >
          <span>{stamp}</span>
          <span style={{ display: "flex", fontWeight: 700, color: PAPER, fontSize: 28 }}><span>ln</span><span style={{ color: AMBER }}>.</span><span>fyi</span></span>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Hero({
  alias,
  place,
  capacity,
  channels,
  grade,
  standing,
  badge,
}: {
  alias: string;
  place: string;
  capacity: string;
  channels: string;
  grade: NodeGrade | null;
  standing: PublicStanding | null;
  badge: boolean;
}) {
  const color = grade ? letterColor(grade.letter) : AMBER;
  const held = grade ? heldBackLine(grade) : null;
  const placeLine = standing?.bounded ? standingLine(standing) : null;
  const nameSize = alias.length > 14 ? 58 : 68;
  if (badge && grade) {
    return (
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: DIM }}>LIGHTNING NODE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color, lineHeight: 1 }}>{grade.letter}</div>
            <div style={{ display: "flex", fontSize: 28, color: DIM }}>{grade.score}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: nameSize, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95 }}>{alias}</div>
          <div style={{ display: "flex", fontSize: 26, color: DIM }}>{place}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 48 }}>
            <BtcStat label="CAPACITY" value={capacity} />
            <CountStat label="CHANNELS" value={channels} />
          </div>
          {placeLine ? <div style={{ display: "flex", fontSize: 24, color: PAPER }}>{placeLine}</div> : null}
          <Bars factors={grade.factors} />
          {held ? <div style={{ display: "flex", fontSize: 20, color: DIM }}>{held}</div> : null}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flex: 1, justifyContent: "space-between", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: DIM }}>LIGHTNING NODE</div>
          <div style={{ display: "flex", fontSize: nameSize, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95 }}>{alias}</div>
          <div style={{ display: "flex", fontSize: 26, color: DIM }}>{place}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 48 }}>
            <BtcStat label="CAPACITY" value={capacity} />
            <CountStat label="CHANNELS" value={channels} />
          </div>
          {placeLine ? (
            <div style={{ display: "flex", fontSize: 24, color: PAPER }}>{placeLine}</div>
          ) : null}
          {grade && <Bars factors={grade.factors} />}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          width: 340,
        }}
      >
        {grade ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: grade.letter.length > 1 ? 220 : 280, fontWeight: 700, color, lineHeight: 0.8, letterSpacing: -6 }}>{grade.letter}</div>
            <div style={{ display: "flex", fontSize: 42, marginTop: 12, color: PAPER }}>{grade.score}</div>
            {held ? (
              <div style={{ display: "flex", fontSize: 20, color: DIM, marginTop: 14, width: 320, textAlign: "right" }}>{held}</div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 28, color: DIM }}>ln.fyi</div>
        )}
      </div>
    </div>
  );
}

function Modest({
  alias,
  place,
  capacity,
  channels,
  grade,
  lead,
}: {
  alias: string;
  place: string;
  capacity: string;
  channels: string;
  grade: NodeGrade;
  lead: string;
}) {
  const held = heldBackLine(grade);
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: DIM }}>LIGHTNING NODE</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: letterColor(grade.letter), lineHeight: 1 }}>{grade.letter}</div>
          <div style={{ display: "flex", fontSize: 28, color: DIM }}>{grade.score}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", fontSize: 28, color: DIM }}>{alias}</div>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, maxWidth: 1040 }}>{lead}</div>
        <div style={{ display: "flex", fontSize: 24, color: DIM }}>{place}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 48 }}>
          <BtcStat label="CAPACITY" value={capacity} />
          <CountStat label="CHANNELS" value={channels} />
        </div>
        <Bars factors={grade.factors} />
        {held ? <div style={{ display: "flex", fontSize: 20, color: DIM }}>{held}</div> : null}
      </div>
    </div>
  );
}

function BtcStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", fontSize: 16, letterSpacing: 2, color: DIM }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>{value}</div>
        <div style={{ display: "flex", fontSize: 18, color: DIM }}>BTC</div>
      </div>
    </div>
  );
}

function CountStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", fontSize: 16, letterSpacing: 2, color: DIM }}>{label}</div>
      <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Bars({ factors }: { factors: GradeFactor[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 640, marginBottom: 8 }}>
      {factors.map((factor) => (
        <div key={factor.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", width: 210, fontSize: 18, color: DIM }}>{`${factor.label} (${factor.weight}%)`}</div>
          <div style={{ display: "flex", width: 280, height: 8, background: RULE }}>
            <div style={{ display: "flex", width: `${Math.max(0, Math.min(100, factor.score))}%`, height: 8, background: AMBER }} />
          </div>
          <div style={{ display: "flex", width: 40, fontSize: 18, color: PAPER }}>{factor.score}</div>
        </div>
      ))}
    </div>
  );
}
