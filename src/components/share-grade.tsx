"use client";

import { useEffect, useRef, useState } from "react";

export function ShareGrade({
  intentHref,
  shareUrl,
}: {
  intentHref: string;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={intentHref}
        target="_blank"
        rel="noreferrer noopener"
        className="mono-xs inline-flex items-center min-h-9 px-3 text-amber border border-[color:var(--rule)] hover:text-paper hover:border-amber focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
      >
        SHARE ON X
      </a>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="mono-xs inline-flex items-center min-h-9 px-3 text-paper border border-[color:var(--rule)] hover:border-amber hover:text-amber focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber transition-colors"
      >
        {copied ? "COPIED" : "COPY LINK"}
      </button>
    </div>
  );
}
