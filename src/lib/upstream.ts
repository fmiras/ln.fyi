// Mempool sometimes drops connections or answers 429/5xx. Those are not
// "this node does not exist." Only an HTTP 404, or a node-route 500 that
// search confirms, is a missing resource. Anything else fails over to the
// next provider and, if every provider fails, is thrown so a cached page is
// kept. A pubkey that has never been cached renders a short-lived fallback
// instead of a 500.

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export const EMZY_BASE = "https://mempool.emzy.de/api/v1";
export const SPACE_BASE = "https://mempool.space/api/v1";

// One attempt per provider. Two providers fit inside the total budget, so a
// hung or 429ing host cannot stack into the ~60s failures seen in production.
export const UPSTREAM_ATTEMPT_TIMEOUT_MS = 2_000;
export const UPSTREAM_TOTAL_BUDGET_MS = 4_000;
// Backup-provider payloads are real but can be staler than the primary.
// Don't pin them to the page's full revalidate window.
export const FALLBACK_REVALIDATE_CAP_SECONDS = 600;

export class MissingResourceError extends Error {
  readonly status = 404;
  readonly url: string;
  constructor(url: string) {
    super(`upstream 404: ${url}`);
    this.name = "MissingResourceError";
    this.url = url;
  }
}

export class UpstreamError extends Error {
  readonly status?: number;
  readonly body?: string;
  constructor(message: string, status?: number, body?: string) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
    this.body = body;
  }
}

export function isMissingResource(err: unknown): boolean {
  return (
    err instanceof MissingResourceError ||
    (typeof err === "object" &&
      err !== null &&
      (err as { name?: string }).name === "MissingResourceError")
  );
}

/** Mempool's node route uses this 500 for a missing row and for a query error. */
export function isMempoolNodeMiss(err: unknown): boolean {
  if (!(err instanceof UpstreamError) || err.status !== 500 || !err.body) return false;
  try {
    const parsed = JSON.parse(err.body) as { error?: unknown };
    return parsed.error === "Failed to get node";
  } catch {
    return false;
  }
}

/**
 * A 500 "Failed to get node" is a real miss only when search agrees the
 * pubkey is absent. If search fails or still finds the node, throw.
 */
export function nodeDetailFailureOutcome(
  err: unknown,
  search: "missing" | "present" | "failed",
): "missing" | "throw" {
  if (isMissingResource(err)) return "missing";
  if (isMempoolNodeMiss(err) && search === "missing") return "missing";
  return "throw";
}

/** Compressed Lightning pubkey: 33 bytes, hex. Anything else cannot be a node. */
export function isLightningPubkey(pubkey: string): boolean {
  return /^[0-9a-fA-F]{66}$/.test(pubkey);
}

/**
 * What `/nodes/[pubkey]` should do with a lookup.
 * `unavailable` is an upstream failure: do not call notFound(), and do not
 * turn it into a 500. A previous good page stays cached; a cold miss renders
 * a short-lived fallback.
 */
export function nodePageDecision(
  pubkey: string,
  error?: unknown,
): "render" | "not-found" | "unavailable" {
  if (!isLightningPubkey(pubkey)) return "not-found";
  if (error === undefined) return "render";
  if (isMissingResource(error)) return "not-found";
  return "unavailable";
}

export type FetchUpstreamOptions = {
  attempts?: number;
  delaysMs?: number[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_ATTEMPTS = 1;
const DEFAULT_DELAYS_MS = [0];

export type ProviderEnv = {
  MEMPOOL_PROVIDERS?: string;
  NEXT_PUBLIC_MEMPOOL_BASE?: string;
};

/**
 * Provider order. emzy is first because its Lightning data is current;
 * mempool.space's statistics and node snapshots lag by days, so it is only
 * the backup when emzy stalls or rate-limits. `MEMPOOL_PROVIDERS` (comma
 * separated) replaces the list. The legacy base, when it is one of the two
 * public instances, stays primary and the other instance is appended.
 */
export function mempoolProviderBases(env?: ProviderEnv): string[] {
  const source = env ?? {
    MEMPOOL_PROVIDERS: process.env.MEMPOOL_PROVIDERS,
    NEXT_PUBLIC_MEMPOOL_BASE: process.env.NEXT_PUBLIC_MEMPOOL_BASE,
  };
  const listed = parseBases(source.MEMPOOL_PROVIDERS);
  if (listed.length > 0) return listed;

  const legacy = source.NEXT_PUBLIC_MEMPOOL_BASE?.trim().replace(/\/$/, "");
  const defaults = [EMZY_BASE, SPACE_BASE];
  if (!legacy) return defaults;
  if (defaults.includes(legacy)) {
    return [legacy, ...defaults.filter((base) => base !== legacy)];
  }
  return [legacy];
}

function parseBases(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function isFailoverEligible(err: unknown): boolean {
  if (isMissingResource(err) || isMempoolNodeMiss(err)) return false;
  if (!(err instanceof UpstreamError)) return false;
  if (err.status === undefined) return true;
  if (err.message.includes("non-JSON")) return true;
  return RETRYABLE_STATUSES.has(err.status);
}

export type ProviderFetchOptions = {
  bases?: string[];
  totalBudgetMs?: number;
  attemptTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Chain endpoints live at /api, not /api/v1. */
  root?: boolean;
  /** Revalidate passed to Next's fetch cache. Fallback hosts cap this. */
  revalidate?: number;
};

type NextInit = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function revalidateForProvider(index: number, requested: number | undefined): number | undefined {
  if (requested === undefined) return undefined;
  if (index === 0) return requested;
  return Math.min(requested, FALLBACK_REVALIDATE_CAP_SECONDS);
}

function endpointBase(base: string, root: boolean): string {
  const trimmed = base.replace(/\/$/, "");
  if (!root) return trimmed;
  return trimmed.replace(/\/v1$/, "");
}

function withRevalidate(init: NextInit, revalidate: number | undefined): NextInit {
  if (revalidate === undefined) return init;
  return { ...init, next: { ...init.next, revalidate } };
}

function combineSignals(timeoutMs: number, parent?: AbortSignal | null): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), Math.max(0, timeoutMs));
  const signal = parent ? AbortSignal.any([timeout.signal, parent]) : timeout.signal;
  return {
    signal,
    cancel: () => clearTimeout(timer),
  };
}

export async function fetchUpstream(
  url: string,
  init: RequestInit,
  options?: FetchUpstreamOptions,
): Promise<Response> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  const delaysMs = options?.delaysMs ?? DEFAULT_DELAYS_MS;
  const timeoutMs = options?.timeoutMs ?? UPSTREAM_ATTEMPT_TIMEOUT_MS;
  const doFetch = options?.fetchImpl ?? fetch;
  let last: UpstreamError | undefined;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(delaysMs[attempt - 1] ?? delaysMs.at(-1) ?? 0);
    const { signal, cancel } = combineSignals(timeoutMs, init.signal);
    try {
      const res = await doFetch(url, { ...init, signal });
      if (res.ok) return res;
      const body = (await res.text().catch(() => "")).slice(0, 500);
      if (res.status === 404) throw new MissingResourceError(url);
      const failed = new UpstreamError(`upstream ${res.status}: ${url}`, res.status, body);
      const retry = RETRYABLE_STATUSES.has(res.status) && attempt < attempts - 1;
      if (!retry) throw failed;
      console.warn(`upstream retry ${attempt + 1}/${attempts - 1}: ${failed.message}`);
      last = failed;
    } catch (err) {
      if (isMissingResource(err)) throw err;
      if (err instanceof UpstreamError && err.status !== undefined) {
        if (attempt === attempts - 1 || !RETRYABLE_STATUSES.has(err.status)) throw err;
        last = err;
        continue;
      }
      const wrapped =
        err instanceof UpstreamError
          ? err
          : new UpstreamError(
              `upstream request failed: ${err instanceof Error ? err.message : String(err)}`,
            );
      if (attempt === attempts - 1) throw wrapped;
      console.warn(`upstream retry ${attempt + 1}/${attempts - 1}: ${wrapped.message}`);
      last = wrapped;
    } finally {
      cancel();
    }
  }

  throw last ?? new UpstreamError(`upstream request failed: ${url}`);
}

export async function readJsonBody<T>(res: Response, label: string): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new UpstreamError(`${label} returned non-JSON`, res.status);
  }
}

export async function getJson<T>(
  url: string,
  init: RequestInit,
  options?: FetchUpstreamOptions,
): Promise<T> {
  const res = await fetchUpstream(url, init, options);
  return readJsonBody<T>(res, url);
}

export async function fetchFromProviders(
  path: string,
  init: NextInit,
  options?: ProviderFetchOptions,
): Promise<Response> {
  const bases = options?.bases ?? mempoolProviderBases();
  const budgetMs = options?.totalBudgetMs ?? UPSTREAM_TOTAL_BUDGET_MS;
  const attemptTimeoutMs = options?.attemptTimeoutMs ?? UPSTREAM_ATTEMPT_TIMEOUT_MS;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const started = Date.now();
  const deadline = new AbortController();
  const budgetTimer = setTimeout(() => deadline.abort(), budgetMs);
  let last: UpstreamError | undefined;

  try {
    for (let i = 0; i < bases.length; i++) {
      const remaining = budgetMs - (Date.now() - started);
      if (remaining < 50 || deadline.signal.aborted) break;
      const url = `${endpointBase(bases[i], options?.root ?? false)}${normalizedPath}`;
      const revalidate = revalidateForProvider(i, options?.revalidate);
      const nextInit = withRevalidate(init, revalidate);
      try {
        return await fetchUpstream(
          url,
          { ...nextInit, signal: deadline.signal },
          {
            attempts: 1,
            timeoutMs: Math.min(attemptTimeoutMs, remaining),
            fetchImpl: options?.fetchImpl,
          },
        );
      } catch (err) {
        if (isMissingResource(err)) throw err;
        if (!isFailoverEligible(err)) throw err;
        const wrapped = err instanceof UpstreamError ? err : new UpstreamError(String(err));
        if (!options?.fetchImpl) {
          console.warn(`upstream failover ${i + 1}/${bases.length}: ${wrapped.message}`);
        }
        last = wrapped;
      }
    }
  } finally {
    clearTimeout(budgetTimer);
  }

  throw last ?? new UpstreamError(`upstream budget exhausted: ${normalizedPath}`);
}

type SearchRow = { public_key?: string };

/**
 * Load one node, failing over when the current provider is slow, rate-limited,
 * or errors. A 500 "Failed to get node" is checked with search on that same
 * host before the next provider is tried, so unknown pubkeys do not fan out.
 * The whole sequence, including search, stays inside `totalBudgetMs`.
 */
export async function resolveNodeDetail<T>(
  pubkey: string,
  options?: ProviderFetchOptions,
): Promise<T> {
  const bases = options?.bases ?? mempoolProviderBases();
  const budgetMs = options?.totalBudgetMs ?? UPSTREAM_TOTAL_BUDGET_MS;
  const attemptTimeoutMs = options?.attemptTimeoutMs ?? UPSTREAM_ATTEMPT_TIMEOUT_MS;
  const started = Date.now();
  const deadline = new AbortController();
  const budgetTimer = setTimeout(() => deadline.abort(), budgetMs);
  let last: unknown;

  try {
    for (let i = 0; i < bases.length; i++) {
      const remaining = budgetMs - (Date.now() - started);
      if (remaining < 50 || deadline.signal.aborted) break;
      const base = bases[i].replace(/\/$/, "");
      const revalidate = revalidateForProvider(i, options?.revalidate);
      const url = `${base}/lightning/nodes/${encodeURIComponent(pubkey)}`;
      const init = withRevalidate(
        { headers: { Accept: "application/json" }, signal: deadline.signal },
        revalidate,
      );
      try {
        const res = await fetchUpstream(url, init, {
          attempts: 1,
          timeoutMs: Math.min(attemptTimeoutMs, remaining),
          fetchImpl: options?.fetchImpl,
        });
        return await readJsonBody<T>(res, url);
      } catch (err) {
        last = err;
        if (isMissingResource(err)) throw err;
        if (!isMempoolNodeMiss(err)) {
          if (isFailoverEligible(err)) {
            if (!options?.fetchImpl) {
              console.warn(
                `upstream failover ${i + 1}/${bases.length}: ${err instanceof Error ? err.message : err}`,
              );
            }
            continue;
          }
          throw err;
        }

        const searchRemaining = budgetMs - (Date.now() - started);
        let search: "missing" | "present" | "failed" = "failed";
        if (searchRemaining >= 50 && !deadline.signal.aborted) {
          search = await searchPubkey(base, pubkey, {
            timeoutMs: Math.min(attemptTimeoutMs, searchRemaining),
            revalidate,
            signal: deadline.signal,
            fetchImpl: options?.fetchImpl,
          });
        }
        if (nodeDetailFailureOutcome(err, search) === "missing") {
          throw new MissingResourceError(url);
        }
      }
    }
  } finally {
    clearTimeout(budgetTimer);
  }

  if (last instanceof Error) throw last;
  throw new UpstreamError("upstream budget exhausted");
}

async function searchPubkey(
  base: string,
  pubkey: string,
  opts: {
    timeoutMs: number;
    revalidate: number | undefined;
    signal: AbortSignal;
    fetchImpl?: typeof fetch;
  },
): Promise<"missing" | "present" | "failed"> {
  const url = `${base}/lightning/nodes/search/${encodeURIComponent(pubkey)}`;
  try {
    const res = await fetchUpstream(
      url,
      withRevalidate(
        { headers: { Accept: "application/json" }, signal: opts.signal },
        opts.revalidate,
      ),
      { attempts: 1, timeoutMs: opts.timeoutMs, fetchImpl: opts.fetchImpl },
    );
    const rows = await readJsonBody<SearchRow[]>(res, url);
    if (!Array.isArray(rows)) return "failed";
    const known = rows.some((row) => row?.public_key?.toLowerCase() === pubkey.toLowerCase());
    return known ? "present" : "missing";
  } catch (err) {
    if (isMissingResource(err)) return "missing";
    return "failed";
  }
}
