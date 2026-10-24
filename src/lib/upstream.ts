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
  constructor(message: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
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
  fetchImpl?: typeof fetch;
};

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAYS_MS = [200, 500];

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
  const doFetch = options?.fetchImpl ?? fetch;
  let last: UpstreamError | undefined;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(delaysMs[attempt - 1] ?? delaysMs.at(-1) ?? 0);
    let res: Response;
    try {
      res = await doFetch(url, init);
    } catch (err) {
      const wrapped = new UpstreamError(
        `upstream request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (attempt === attempts - 1) throw wrapped;
      console.warn(`upstream retry ${attempt + 1}/${attempts - 1}: ${wrapped.message}`);
      last = wrapped;
      continue;
    }

    if (res.ok) return res;
    await res.body?.cancel().catch(() => undefined);

    if (res.status === 404) throw new MissingResourceError(url);

    const failed = new UpstreamError(`upstream ${res.status}: ${url}`, res.status);
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
