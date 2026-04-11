import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexSansCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-sans-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ln.fyi — An editorial atlas of the Lightning Network",
  description:
    "A live, open dashboard tracking capacity, nodes, channels and activity across the Bitcoin Lightning Network. Data from mempool.space.",
  metadataBase: new URL("https://ln.fyi"),
  openGraph: {
    title: "ln.fyi — An editorial atlas of the Lightning Network",
    description:
      "Capacity, nodes, channels and activity across Bitcoin's Lightning Network.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSansCondensed.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
