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

> The site currently reads from the **emzy.de mempool mirror** — the primary
> mempool.space instance stopped updating its Lightning statistics endpoints
> in January 2026. Override with `NEXT_PUBLIC_MEMPOOL_BASE` if you run your
> own mirror.

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
| `NEXT_PUBLIC_MEMPOOL_BASE` | `https://mempool.emzy.de/api/v1` | Base URL for the mempool Lightning API |

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
profile pages, their Open Graph images, and the mempool fetches they make
revalidate once a day. Profiles are generated on first request rather than
at build time, so a mirror outage cannot be frozen in as a not-found page.
A profile is cached as missing only when the pubkey is impossible, the
upstream API returns 404, or mempool's node route answers
`500 {"error":"Failed to get node"}` and node search agrees the key is
absent. Network errors, rate limits, other 5xx responses, and a node-route
500 that search cannot confirm are retried and then thrown so the last good
page stays up. There is no client-side polling.

## Contributing

This is a personal project, but issues and PRs are welcome — especially for
data-quality fixes, accessibility, and new editorial views of the network.

## License

Public domain.
