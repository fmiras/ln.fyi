"use client";

import { useState } from "react";

export function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState<"link" | "nostr" | null>(null);
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const nostrHref = `https://nostrudel.ninja/#/publish?draft=${encodeURIComponent(text)}`;

  async function copy(kind: "link" | "nostr", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={xHref}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonClass}
      >
        SHARE ON X
      </a>
      <a
        href={nostrHref}
        target="_blank"
        rel="noreferrer noopener"
        className={buttonClass}
        onClick={() => {
          void copy("nostr", text);
        }}
      >
        {copied === "nostr" ? "NOTE COPIED" : "SHARE ON NOSTR"}
      </a>
      <button type="button" className={buttonClass} onClick={() => void copy("link", url)}>
        {copied === "link" ? "LINK COPIED" : "COPY LINK"}
      </button>
    </div>
  );
}

const buttonClass =
  "mono-xs inline-flex items-center justify-center min-h-9 px-3 py-2 border border-[color:var(--rule-strong)] text-paper hover:text-amber hover:border-amber transition-colors";
