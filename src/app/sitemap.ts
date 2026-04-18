import type { MetadataRoute } from "next";
import { api, safe } from "@/lib/api";
import { SITE_URL, slugify } from "@/lib/seo";
import { aliasIndex } from "@/lib/rankings";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [countries, ispsData, liq, conn, old, aliases] = await Promise.all([
    safe(api.countries()),
    safe(api.ispsRanked()),
    safe(api.topByCapacity()),
    safe(api.topByConnectivity()),
    safe(api.oldest()),
    aliasIndex(),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/nodes`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/countries`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/isp`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Only list countries with enough nodes to merit a full page
  const countryUrls: MetadataRoute.Sitemap = (countries ?? [])
    .filter((c) => c.iso && c.count >= 3)
    .map((c) => ({
      url: `${SITE_URL}/countries/${c.iso.toLowerCase()}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const ispUrls: MetadataRoute.Sitemap = (ispsData ?? [])
    .filter((i) => i.name && i.capacity > 0 && i.nodes >= 3)
    .map((i) => ({
      url: `${SITE_URL}/isp/${slugify(i.name)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  // Alias URLs (/n/binance, /n/bitrefill, etc.) — these resolve via
  // redirect-or-disambiguation to the pubkey page. Only emit ones that
  // currently have at least one ranked match so Google doesn't index 404s.
  const aliasUrls: MetadataRoute.Sitemap = Array.from(aliases.entries())
    .filter(([slug, matches]) => slug && matches.length > 0)
    .map(([slug]) => ({
      url: `${SITE_URL}/n/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));

  // Union of all three ranking endpoints — unique pubkeys only
  const pubkeys = new Set<string>();
  for (const list of [liq, conn, old]) {
    if (!list) continue;
    for (const n of list) if (n.publicKey) pubkeys.add(n.publicKey);
  }
  const nodeUrls: MetadataRoute.Sitemap = Array.from(pubkeys).map((pk) => ({
    url: `${SITE_URL}/nodes/${pk}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    ...staticUrls,
    ...countryUrls,
    ...ispUrls,
    ...nodeUrls,
    ...aliasUrls,
  ];
}
