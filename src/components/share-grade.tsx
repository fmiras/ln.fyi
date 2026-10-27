"use client";

import { useEffect, useRef, useState } from "react";

export function ShareGrade({
  intentHref,
  shareUrl,
  shareText,
  primaryLabel,
}: {
  intentHref: string;
  shareUrl: string;
  shareText: string;
  primaryLabel: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Copied");
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(null), 2000);
    } catch {
      setToast(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <a
          href={intentHref}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center min-h-11 px-3 bg-amber text-ink font-mono text-[12px] hover:bg-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
        >
          {primaryLabel}
        </a>
        <button
          type="button"
          onClick={() => copy(shareUrl)}
          className="inline-flex items-center min-h-11 px-3 text-paper border border-[color:var(--rule)] font-mono text-[12px] hover:border-amber hover:text-amber focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => copy(`${shareText}\n${shareUrl}`)}
          className="inline-flex items-center min-h-11 px-3 text-paper border border-[color:var(--rule)] font-mono text-[12px] hover:border-amber hover:text-amber focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
        >
          Copy for Nostr
        </button>
      </div>
      <p role="status" aria-live="polite" className="font-mono text-[12px] text-amber min-h-4">
        {toast ?? ""}
      </p>
    </div>
  );
}
