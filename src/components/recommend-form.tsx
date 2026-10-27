"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePubkeyInput } from "@/lib/recommend";

export function RecommendForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pubkey = parsePubkeyInput(value);
    if (!pubkey) {
      setError("Paste a 66-character node pubkey.");
      return;
    }
    setError(null);
    router.push(`/recommend/${pubkey}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="peer-pubkey" className="mono-xs text-paper-faint">
        YOUR NODE PUBKEY
      </label>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          id="peer-pubkey"
          name="pubkey"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="02abc… 66 hex characters"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-ink border border-[color:var(--rule-strong)] px-3 py-3 mono text-[12px] text-paper placeholder:text-paper-faint outline-none focus:border-amber"
        />
        <button
          type="submit"
          className="mono-xs px-4 py-3 bg-amber text-ink hover:bg-paper transition-colors shrink-0"
        >
          SHOW PEERS
        </button>
      </div>
      {error ? (
        <p className="mono-xs text-bad" role="alert">
          {error}
        </p>
      ) : (
        <p className="mono-xs text-paper-faint">
          The list is cached per pubkey. Nothing here fans out across the graph.
        </p>
      )}
    </form>
  );
}
