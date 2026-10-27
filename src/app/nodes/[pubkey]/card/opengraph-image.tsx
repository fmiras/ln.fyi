import { nodeCardImage } from "@/lib/node-card-image";

export const alt = "Lightning node report card on ln.fyi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;
export const maxDuration = 15;

export default async function Image({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  return nodeCardImage(pubkey);
}
