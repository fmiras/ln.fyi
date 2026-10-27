# ln.fyi

**An editorial atlas of the Bitcoin Lightning Network.**

A live, open dashboard tracking capacity, nodes, channels and onchain activity
across Lightning. No accounts, no API keys. Anonymous page-view counts
via Vercel Analytics.

Live at **[ln.fyi](https://ln.fyi)**.

---

## What's inside

- **Network overview** — total capacity, node/channel counts, 30-day deltas,
  multi-year history charts.
- **Node directory** — top nodes by capacity and connectivity, searchable.
- **Node profiles** — per-node capacity/channel history, server metadata
  (AS, geo, Tor/clearnet sockets), and a public onchain transactions feed
  reconstructed from channel opens and closes.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, RSC, route-level `revalidate`)
- React 19, TypeScript 5
- Tailwind CSS 4
- IBM Plex Sans / Sans Condensed / Mono
- Data: [mempool.space Lightning REST API](https://mempool.space/docs/api/rest)

> Lightning data comes from the **emzy.de mempool mirror** first. The public
> mempool.space instance still answers, but its Lightning snapshots lag by
> days, so it is only used when emzy stalls or returns 429. Set
> `MEMPOOL_PROVIDERS` to change the order.

## Running locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `MEMPOOL_PROVIDERS` | emzy, then mempool.space | Comma-separated Lightning API bases, tried in order |
| `NEXT_PUBLIC_MEMPOOL_BASE` | unset | Legacy single base. A public instance stays primary and the other public instance is kept as backup. A custom URL is used alone. |

## Project layout

```
src/
  app/
    page.tsx              # Network overview (/)
    nodes/                # Node directory + profiles
    about/                # About page
    layout.tsx            # Root shell, fonts, metadata
  components/             # Panel, chart, stat, shell, hero-number, live-tick
  lib/
    api.ts                # mempool Lightning API client + formatters
```

All data fetches are server-side with Next.js cache revalidation.
The network overview stays on a short window (about 2–10 minutes). Node
profile pages and their Open Graph images revalidate once a day when the
primary directory answers. Each upstream call has a 4 second budget and
fails over to the next provider after about 2 seconds, so a hung host cannot
hold the render. The node document is loaded once per request and shared
with `generateMetadata`. The top 20 nodes by capacity are prerendered.

A profile is cached as missing only when the pubkey is impossible, the
upstream API returns 404, or mempool's node route answers
`500 {"error":"Failed to get node"}` and node search on that host agrees the
key is absent. If the primary is down and a previous good profile exists, that
page stays up. A pubkey that has never been cached renders a short-lived
unavailable page (about a minute) instead of a 500. Backup-provider data is
kept for about 10 minutes so the primary is tried again soon. There is no
client-side polling.

## Contributing

This is a personal project, but issues and PRs are welcome — especially for
data-quality fixes, accessibility, and new editorial views of the network.

## License

Public domain.
