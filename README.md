# ln.fyi

**An editorial atlas of the Bitcoin Lightning Network.**

A live, open dashboard tracking capacity, nodes, channels and onchain activity
across Lightning. No accounts, no tracking, no API keys.

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

All data fetches are server-side with Next.js cache revalidation
(typically 120–600s). There is no client-side polling.

## Contributing

This is a personal project, but issues and PRs are welcome — especially for
data-quality fixes, accessibility, and new editorial views of the network.

## License

Public domain.
