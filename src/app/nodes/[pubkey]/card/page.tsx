import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { formatNumber } from "@/lib/api";
import { ReportCard } from "@/components/report-card";
import { capRouteRevalidate } from "@/lib/node-profile";
import { loadNodeGrade } from "@/lib/node-report";
import { SITE_NAME, breadcrumbJsonLd, buildMetadata, jsonLdScript } from "@/lib/seo";

export const revalidate = 86400;
export const maxDuration = 15;
export const dynamicParams = true;

// Empty on purpose: cards are filled on first visit and then cached for a day.
// Prerendering every pubkey here would repeat the profile fetches.
export function generateStaticParams() {
  return [];
}

const UNAVAILABLE_REVALIDATE_SECONDS = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}): Promise<Metadata> {
  const { pubkey } = await params;
  const key = pubkey.toLowerCase();
  try {
    const loaded = await loadNodeGrade(pubkey);
    if (loaded.status !== "ready") {
      return buildMetadata({
        title: "Lightning node report card",
        description: "A shareable grade for a public Lightning node. Directory data is temporarily unavailable.",
        path: `/nodes/${key}/card`,
        noindex: true,
      });
    }
    const alias = (loaded.profile.node.alias || "Anonymous").trim();
    return buildMetadata({
      title: `${alias} — Lightning report card`,
      description: `${alias} scores ${loaded.grade.letter} (${loaded.grade.score}/100) on ln.fyi. ${loaded.grade.summary} Capacity, channels, connectivity, fees, age, and announced presence, with the rules in the open.`,
      path: `/nodes/${key}/card`,
    });
  } catch (err) {
    unstable_rethrow(err);
    return buildMetadata({
      title: "Lightning node report card",
      description: "A shareable grade for a public Lightning node. Directory data is temporarily unavailable.",
      path: `/nodes/${key}/card`,
      noindex: true,
    });
  }
}

export default async function NodeCardPage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  let loaded;
  try {
    loaded = await loadNodeGrade(pubkey);
  } catch (err) {
    unstable_rethrow(err);
    await capRouteRevalidate(UNAVAILABLE_REVALIDATE_SECONDS);
    return <CardUnavailable pubkey={pubkey} />;
  }
  if (loaded.status === "not-found") notFound();
  if (loaded.status !== "ready") {
    await capRouteRevalidate(UNAVAILABLE_REVALIDATE_SECONDS);
    return <CardUnavailable pubkey={pubkey} />;
  }

  const node = loaded.profile.node;
  const alias = (node.alias || "Anonymous").trim();
  const key = node.public_key.toLowerCase();
  const color = node.color && /^#[0-9a-f]{6}$/i.test(node.color) ? node.color : undefined;
  const aside =
    node.opened_channel_count != null
      ? `Lifetime ${formatNumber(node.opened_channel_count)} opened and ${formatNumber(node.closed_channel_count ?? 0)} closed. Closures are not part of the grade.`
      : undefined;
  const jsonLd = breadcrumbJsonLd([
    { name: SITE_NAME, path: "/" },
    { name: "Nodes", path: "/nodes" },
    { name: alias, path: `/nodes/${key}` },
    { name: "Report card", path: `/nodes/${key}/card` },
  ]);

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="display text-[36px] md:text-[64px] leading-[0.9] text-paper">
          {(node.alias || "ANONYMOUS").toUpperCase()}
        </h1>
        <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 max-w-2xl">
          A shareable grade from the public directory. Same inputs as the profile,
          scored in the open so a screenshot still explains itself.
        </p>
      </div>
      <ReportCard
        grade={loaded.grade}
        alias={alias}
        pubkey={key}
        color={color}
        aside={aside}
        layout="poster"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
    </div>
  );
}

function CardUnavailable({ pubkey }: { pubkey: string }) {
  return (
    <div className="flex-1 overflow-auto px-4 md:px-8 py-10 max-w-3xl">
      <div className="mono-xs text-amber mb-3">§ NODE REPORT</div>
      <h1 className="display text-[32px] md:text-[48px] text-paper">TEMPORARILY UNAVAILABLE</h1>
      <p className="ui text-[15px] text-paper-dim mt-4">
        The directory did not answer in time, so this card was not graded. It will be fetched again shortly.
      </p>
      <div className="mono-xs text-paper-faint break-all mt-6">{pubkey}</div>
    </div>
  );
}
