import Link from "next/link";
import { LiveTick } from "./live-tick";

const NAV = [
  { href: "/", label: "OVERVIEW", num: "01" },
  { href: "/nodes", label: "NODES", num: "02" },
  { href: "/about", label: "ABOUT", num: "04" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100svh] flex flex-col overflow-hidden">
      <TopBar />
      <main className="relative flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="shrink-0 z-40 bg-ink rule-b">
      <div className="px-3 md:px-6">
        <div className="flex items-center justify-between h-11 md:h-10 gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span className="ui-bold tracking-tight text-[18px] leading-none text-paper shrink-0">
              ln<span className="text-amber">.</span>fyi
            </span>
            <span className="mono-xs text-paper-faint hidden lg:inline truncate">
              LIGHTNING NETWORK · CONTROL
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-stretch">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-1.5 px-4 border-l border-[color:var(--rule)] hover:bg-[#ffffff04] transition-colors"
              >
                <span className="mono-xs text-paper-faint group-hover:text-amber">
                  {item.num}
                </span>
                <span className="mono-xs text-paper group-hover:text-amber transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 h-full md:border-l md:border-[color:var(--rule)] md:pl-4">
            <LiveTick />
          </div>
        </div>
      </div>

      {/* Mobile nav strip */}
      <nav className="md:hidden flex items-stretch rule-t overflow-x-auto">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex-1 flex items-center justify-center gap-1.5 py-2.5 border-r border-[color:var(--rule)] last:border-r-0 hover:bg-[#ffffff04] transition-colors min-w-[80px]"
          >
            <span className="mono-xs text-paper-faint group-hover:text-amber">
              {item.num}
            </span>
            <span className="mono-xs text-paper group-hover:text-amber transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
