// Mempool sometimes drops connections or answers 429/5xx. Those are not
// "this node does not exist." Only an HTTP 404 is a missing resource.
// Anything else is thrown so ISR keeps the last good page (or, with nothing
// cached yet, returns a short-lived 500 and tries again on the next request).

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

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
 * `error` means the caller must rethrow so the response is not cached as 404.
 */
export function nodePageDecision(
  pubkey: string,
  error?: unknown,
): "render" | "not-found" | "error" {
  if (!isLightningPubkey(pubkey)) return "not-found";
  if (error === undefined) return "render";
  if (isMissingResource(error)) return "not-found";
  return "error";
}

export type FetchUpstreamOptions = {
  attempts?: number;
  delaysMs?: number[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAYS_MS = [200, 500];
// A dropped TLS connection to the mirror can hang instead of rejecting.
// Bound each attempt so three tries still finish well inside the function limit.
const DEFAULT_TIMEOUT_MS = 10_000;

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUpstream(
  url: string,
  init: RequestInit,
  options?: FetchUpstreamOptions,
): Promise<Response> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  const delaysMs = options?.delaysMs ?? DEFAULT_DELAYS_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = options?.fetchImpl ?? fetch;
  let last: UpstreamError | undefined;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(delaysMs[attempt - 1] ?? delaysMs.at(-1) ?? 0);
    let res: Response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await doFetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      const wrapped = new UpstreamError(
        `upstream request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (attempt === attempts - 1) throw wrapped;
      console.warn(`upstream retry ${attempt + 1}/${attempts - 1}: ${wrapped.message}`);
      last = wrapped;
      continue;
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) return res;
    const body = (await res.text().catch(() => "")).slice(0, 500);

    if (res.status === 404) throw new MissingResourceError(url);

    const failed = new UpstreamError(`upstream ${res.status}: ${url}`, res.status, body);
    const retry = RETRYABLE_STATUSES.has(res.status) && attempt < attempts - 1;
    if (!retry) throw failed;
    console.warn(`upstream retry ${attempt + 1}/${attempts - 1}: ${failed.message}`);
    last = failed;
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
