import type { Metadata } from "next";

export const SITE_URL = "https://ln.fyi";
export const SITE_NAME = "ln.fyi";
export const SITE_TAGLINE = "An editorial atlas of the Lightning Network";

type MetaArgs = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  image,
  noindex,
}: MetaArgs): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: title }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Live, open dashboard tracking capacity, nodes, channels and activity across the Bitcoin Lightning Network.",
    sameAs: ["https://github.com/fmiras/ln.fyi"],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
  };
}

export function datasetJsonLd(args: {
  name: string;
  description: string;
  path: string;
  lastModified?: number | string;
  keywords?: string[];
}): JsonLd {
  const date =
    typeof args.lastModified === "number"
      ? new Date(args.lastModified * 1000).toISOString()
      : args.lastModified;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: args.name,
    description: args.description,
    url: `${SITE_URL}${args.path}`,
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isAccessibleForFree: true,
    ...(date ? { dateModified: date } : {}),
    ...(args.keywords ? { keywords: args.keywords } : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function jsonLdScript(data: JsonLd | JsonLd[]): { __html: string } {
  return { __html: JSON.stringify(data) };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['".,&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Back-compat alias — used by ISP routes before we generalized the helper.
export const slugifyIsp = slugify;
