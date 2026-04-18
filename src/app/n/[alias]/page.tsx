import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { formatSats, formatNumber, shortKey } from "@/lib/api";
import { Panel } from "@/components/panel";
import { aliasIndex } from "@/lib/rankings";
import {
  breadcrumbJsonLd,
  buildMetadata,
  datasetJsonLd,
  jsonLdScript,
  SITE_NAME,
} from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const index = await aliasIndex();
  return Array.from(index.keys()).map((alias) => ({ alias }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ alias: string }>;
}): Promise<Metadata> {
  const { alias } = await params;
  const index = await aliasIndex();
  const matches = index.get(alias.toLowerCase()) ?? [];
  if (matches.length === 0) {
    return buildMetadata({
      title: `Lightning node "${alias}" not found`,
      description: `No Lightning Network node matching "${alias}" was found.`,
      path: `/n/${alias}`,
      noindex: true,
    });
  }
  const top = matches[0];
  if (matches.length === 1) {
    return buildMetadata({
      title: `${top.alias} — Lightning Node`,
      description: `${top.alias} is a public Lightning Network node with ${formatSats(top.capacity)} BTC capacity across ${formatNumber(top.channels)} channels.`,
      path: `/n/${alias}`,
    });
  }
  return buildMetadata({
    title: `Lightning nodes named "${top.alias}"`,
    description: `${matches.length} public Lightning Network nodes share the alias "${top.alias}". Compare capacity, channels and operators.`,
    path: `/n/${alias}`,
  });
}

export default async function AliasPage({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const index = await aliasIndex();
  const matches = index.get(alias.toLowerCase());
  if (!matches || matches.length === 0) return notFound();

  // Unique alias → 308 permanent redirect to the canonical pubkey URL so
  // link equity transfers and Google consolidates the two URLs.
  if (matches.length === 1) {
    permanentRedirect(`/nodes/${matches[0].pubkey}`);
  }

  const displayAlias = matches[0].alias;

  const jsonLd = [
    datasetJsonLd({
      name: `Lightning nodes named "${displayAlias}"`,
      description: `${matches.length} public Lightning Network nodes share the alias "${displayAlias}".`,
      path: `/n/${alias}`,
      keywords: [displayAlias, "Lightning node", "Lightning Network"],
    }),
    breadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Nodes", path: "/nodes" },
      { name: displayAlias, path: `/n/${alias}` },
    ]),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="rule-b px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="mono-xs text-amber mb-2">§ ALIAS MATCH</div>
        <h1 className="display text-[32px] md:text-[56px] lg:text-[72px] leading-[0.95] text-paper truncate">
          NODES NAMED &ldquo;{displayAlias.toUpperCase()}&rdquo;
        </h1>
        <p className="ui text-[13px] md:text-[15px] text-paper-dim mt-3 md:mt-4 max-w-2xl">
          {matches.length} public Lightning Network nodes share this alias. Pick a profile below to see its capacity, channels and hosting.
        </p>
      </div>

      <div className="bg-ink">
        <Panel id="A01" title="MATCHES" meta={`${matches.length} NODES`} className="border-0">
          <div className="px-4 md:px-6 py-3 md:py-4">
            {matches.map((m, i) => (
              <Link
                key={m.pubkey}
                href={`/nodes/${m.pubkey}`}
                className="group flex items-center gap-3 py-3 rule-b last:border-b-0 hover:bg-[#ffffff05] transition-colors"
              >
                <span className="mono-xs text-paper-faint tabular w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="ui text-[14px] text-paper truncate group-hover:text-amber transition-colors">
                    {m.alias}
                  </div>
                  <div className="mono-xs text-paper-faint tabular truncate">
                    {shortKey(m.pubkey)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mono tabular text-paper text-[13px]">
                    ₿ {formatSats(m.capacity)}
                  </div>
                  <div className="mono-xs text-paper-faint tabular">
                    {formatNumber(m.channels)} ch
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
    </div>
  );
}
