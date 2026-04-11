import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Zap,
  Network,
  Users,
  Bitcoin,
  Shield,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Route,
  LockKeyhole,
  Globe,
  BookOpen
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Learn Lightning',
  description:
    'Everything you need to understand the Lightning Network: channels, nodes, invoices, routing, fees, liquidity, and more. Plain English, zero fluff.',
  openGraph: {
    title: 'Learn Lightning — ln.fyi',
    description:
      'Plain-English primer on the Lightning Network: channels, nodes, invoices, routing, fees, and liquidity.',
    type: 'article'
  },
  alternates: {
    canonical: 'https://ln.fyi/learn'
  }
}

const TOC = [
  { id: 'what', label: 'What is Lightning?' },
  { id: 'channels', label: 'Channels' },
  { id: 'nodes', label: 'Nodes' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'routing', label: 'Routing & Fees' },
  { id: 'liquidity', label: 'Liquidity' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'resources', label: 'Go deeper' }
] as const

function Section({
  id,
  icon,
  title,
  children
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 flex flex-col gap-4">
      <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-semibold tracking-tight">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
          {icon}
        </span>
        {title}
      </h2>
      <div className="text-base text-muted-foreground leading-relaxed flex flex-col gap-3 text-pretty">
        {children}
      </div>
    </section>
  )
}

function Fact({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium text-foreground">{children}</div>
    </div>
  )
}

export default function LearnPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Learn Lightning — plain English primer',
    author: { '@type': 'Person', name: 'Fede Miras' },
    datePublished: '2025-01-01',
    publisher: { '@type': 'Organization', name: 'ln.fyi' },
    mainEntityOfPage: 'https://ln.fyi/learn'
  }

  return (
    <main className="flex flex-col gap-12 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-orange-500">
            <BookOpen className="h-3.5 w-3.5" />
            Lightning 101
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance leading-[1.05]">
            Learn the Lightning Network.
            <br />
            <span className="text-muted-foreground">No fluff.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            A condensed, plain-English primer on Bitcoin&rsquo;s Layer 2. Skim the sections,
            copy the jargon, impress your friends.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6">
        <nav
          aria-label="Table of contents"
          className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            On this page
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            {TOC.map((item, i) => (
              <li key={item.id}>
                <Link
                  href={`#${item.id}`}
                  className="flex items-center gap-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="text-xs font-mono tabular-nums text-muted-foreground/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <article className="container mx-auto px-4 sm:px-6 max-w-3xl flex flex-col gap-14">
        <Section
          id="what"
          icon={<Zap className="h-5 w-5" />}
          title="What is the Lightning Network?"
        >
          <p>
            Lightning is a <strong className="text-foreground">payment protocol built on top of Bitcoin</strong>.
            Instead of writing every transaction to the blockchain, two parties open a
            shared channel, send money back and forth off-chain at the speed of an
            HTTP request, and only settle the net balance on-chain when they&rsquo;re done.
          </p>
          <p>
            The result is near-instant, near-free Bitcoin payments — the exact
            ingredient missing from Bitcoin&rsquo;s base layer, which is optimised for
            settlement, not for buying a coffee.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            <Fact label="Confirmation">Instant</Fact>
            <Fact label="Typical fee">&lt; 1 sat</Fact>
            <Fact label="Settlement">On-chain</Fact>
          </div>
        </Section>

        <Section
          id="channels"
          icon={<Network className="h-5 w-5" />}
          title="Channels: the payment highway"
        >
          <p>
            A Lightning channel is like a shared prepaid tab between two nodes. Both
            parties commit bitcoin into a 2-of-2 multisig address — that&rsquo;s the
            channel&rsquo;s <strong className="text-foreground">capacity</strong>.
          </p>
          <p>
            Inside the channel, balances shift back and forth as payments happen.
            Nothing hits the chain until the channel closes. If either party tries to
            cheat (by broadcasting an old state), the protocol lets the other party
            claim all of the funds. It&rsquo;s trustless by design.
          </p>
          <p>
            You don&rsquo;t need a direct channel with everyone — payments hop through
            intermediate nodes, each of which forwards for a tiny fee.
          </p>
        </Section>

        <Section id="nodes" icon={<Users className="h-5 w-5" />} title="Nodes: who runs Lightning?">
          <p>
            A Lightning node is a piece of software (LND, Core Lightning, Eclair, LDK,
            etc.) that speaks the Lightning protocol, keeps channels alive and routes
            payments. Anyone can run one — from a Raspberry Pi in your closet to a
            beefy routing business.
          </p>
          <p>
            Some nodes are optimised for <strong className="text-foreground">routing</strong>{' '}
            (big capacity, tons of channels, reliable uptime). Others are leaner
            &ldquo;spend-only&rdquo; wallets on a phone. Both belong to the same network.
          </p>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="text-sm text-foreground font-medium mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Check live node data
            </div>
            <div className="text-sm text-muted-foreground">
              Browse the{' '}
              <Link href="/ranking" className="text-orange-500 hover:underline">
                top 100 nodes by capacity & channels
              </Link>{' '}
              — updated in real-time.
            </div>
          </div>
        </Section>

        <Section
          id="invoices"
          icon={<FileText className="h-5 w-5" />}
          title="Invoices: how you get paid"
        >
          <p>
            Lightning payments use <strong className="text-foreground">BOLT11 invoices</strong>.
            Think of them as one-time payment requests: the receiver generates an
            invoice with an amount, a description, a payee and an expiry, and the
            sender&rsquo;s wallet resolves a route to deliver the payment.
          </p>
          <p>
            Invoices always start with <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">lnbc</code>{' '}
            for mainnet. They&rsquo;re usually shown as a QR code and/or the raw string.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <Fact label="Amount">Sats / BTC</Fact>
            <Fact label="Expiry">Usually 1h</Fact>
            <Fact label="Description">Optional memo</Fact>
            <Fact label="Signature">Auth of payee</Fact>
          </div>
          <p>
            Got one you&rsquo;d like to inspect?{' '}
            <Link href="/invoice" className="text-orange-500 hover:underline inline-flex items-center gap-1">
              Decode it here <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </Section>

        <Section id="routing" icon={<Route className="h-5 w-5" />} title="Routing & Fees">
          <p>
            When you pay someone you don&rsquo;t have a direct channel with, the network
            finds a path through other nodes. Each hop charges two fees:
          </p>
          <ul className="list-none flex flex-col gap-2">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <div>
                <strong className="text-foreground">Base fee</strong> — a fixed amount
                per payment, measured in millisatoshis (msat).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
              <div>
                <strong className="text-foreground">Proportional fee</strong> — a
                percentage of the payment, expressed in <em>parts per million</em>{' '}
                (ppm). 1000 ppm = 0.1%.
              </div>
            </li>
          </ul>
          <p>
            Fees are typically negligible — a 10&nbsp;000 sat payment across multiple
            hops usually costs less than a single sat. The network&rsquo;s average fee
            rate currently hovers around 200–500 ppm.
          </p>
        </Section>

        <Section
          id="liquidity"
          icon={<Bitcoin className="h-5 w-5" />}
          title="Liquidity: the magic word"
        >
          <p>
            A channel&rsquo;s capacity is just the total. What matters is{' '}
            <strong className="text-foreground">how the balance is split</strong>. If
            all of the funds sit on your side, you can send but not receive. If
            they&rsquo;re all on the other side, you can receive but not send.
          </p>
          <p>
            This is why routing nodes obsess over <em>inbound</em> and <em>outbound</em>{' '}
            liquidity. Balancing channels — via circular rebalancing, submarine swaps,
            or buying inbound from liquidity marketplaces — is basically the
            full-time job of a routing operator.
          </p>
        </Section>

        <Section
          id="privacy"
          icon={<LockKeyhole className="h-5 w-5" />}
          title="Privacy: better than on-chain"
        >
          <p>
            Lightning payments are <strong className="text-foreground">onion-routed</strong>.
            Each hop only knows the previous and next node, not the full path or the
            final destination. Intermediate nodes can&rsquo;t tell if they&rsquo;re the first,
            middle or last hop.
          </p>
          <p>
            The trade-off: channel opens and closes are visible on-chain, and channel
            balances leak information to your direct peers. For maximum privacy, pair
            Lightning with Tor — in fact, many nodes run Tor-only.
          </p>
        </Section>

        <Section id="resources" icon={<Globe className="h-5 w-5" />} title="Go deeper">
          <p>Ready for the rabbit hole?</p>
          <ul className="list-none flex flex-col gap-2">
            {[
              {
                href: 'https://lightning.network/lightning-network-paper.pdf',
                label: 'The original Lightning whitepaper (2016)',
                hint: 'Poon & Dryja'
              },
              {
                href: 'https://github.com/lightning/bolts',
                label: 'BOLT specifications',
                hint: 'The protocol, in the gnarly details'
              },
              {
                href: 'https://github.com/lnbook/lnbook',
                label: 'Mastering the Lightning Network (free)',
                hint: 'A.M. Antonopoulos, Osuntokun, Pickhardt'
              },
              {
                href: 'https://amboss.space',
                label: 'amboss.space',
                hint: 'Node explorer & analytics'
              },
              {
                href: 'https://mempool.space',
                label: 'mempool.space',
                hint: 'Where ln.fyi&rsquo;s data comes from'
              }
            ].map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-4 hover:border-orange-500/40 transition-colors group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {r.label}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      dangerouslySetInnerHTML={{ __html: r.hint }}
                    />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Shield className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold">You now know the basics.</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Head back to the dashboard to watch the network live, or browse real
              nodes and their stats.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-orange-500 px-4 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Network dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/ranking"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/60 px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Top 100 nodes
              </Link>
            </div>
          </div>
        </div>
      </article>

      <section className="container mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-orange-500 shrink-0" />
          <span>
            This primer is intentionally concise. The Lightning protocol is still
            evolving; for the latest changes, follow{' '}
            <Link
              href="https://github.com/lightning/bolts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline"
            >
              the BOLT specs
            </Link>
            .
          </span>
        </div>
      </section>
    </main>
  )
}
