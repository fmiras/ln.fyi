import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMZY_BASE,
  FALLBACK_REVALIDATE_CAP_SECONDS,
  MissingResourceError,
  SPACE_BASE,
  UPSTREAM_ATTEMPT_TIMEOUT_MS,
  UPSTREAM_TOTAL_BUDGET_MS,
  UpstreamError,
  fetchFromProviders,
  getJson,
  isMempoolNodeMiss,
  isMissingResource,
  mempoolProviderBases,
  nodeDetailFailureOutcome,
  nodePageDecision,
  resolveNodeDetail,
} from "./upstream.ts";

const PUBKEY = "02" + "ab".repeat(32);

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function scripted(responses: Array<Response | Error>) {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    calls.push(String(input));
    const next = responses.shift();
    if (!next) throw new Error("unexpected fetch");
    if (next instanceof Error) throw next;
    return next;
  };
  return { calls, fetchImpl };
}

const opts = (fetchImpl: typeof fetch) => ({
  fetchImpl,
  delaysMs: [0, 0],
  attempts: 3,
});

describe("getJson", () => {
  it("returns JSON from a 200", async () => {
    const { calls, fetchImpl } = scripted([jsonResponse(200, { alias: "ok" })]);
    const data = await getJson<{ alias: string }>("https://example.test/node", {}, opts(fetchImpl));
    assert.equal(data.alias, "ok");
    assert.equal(calls.length, 1);
  });

  it("treats upstream 404 as missing and does not retry", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(404, { message: "not found" }),
      jsonResponse(200, { alias: "should-not-run" }),
    ]);
    await assert.rejects(
      () => getJson("https://example.test/missing", {}, opts(fetchImpl)),
      (err: unknown) => {
        assert.equal(isMissingResource(err), true);
        assert.ok(err instanceof MissingResourceError);
        return true;
      },
    );
    assert.equal(calls.length, 1);
  });

  it("retries 429 and 5xx, then returns the successful body", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(429, { message: "slow down" }),
      jsonResponse(503, { message: "unavailable" }),
      jsonResponse(200, { alias: "recovered" }),
    ]);
    const data = await getJson<{ alias: string }>("https://example.test/node", {}, opts(fetchImpl));
    assert.equal(data.alias, "recovered");
    assert.equal(calls.length, 3);
  });

  it("throws after retryable failures are exhausted", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(502, {}),
      jsonResponse(500, {}),
      new Error("SSL_ERROR_SYSCALL"),
    ]);
    await assert.rejects(
      () => getJson("https://example.test/node", {}, opts(fetchImpl)),
      (err: unknown) => err instanceof UpstreamError && !isMissingResource(err),
    );
    assert.equal(calls.length, 3);
  });

  it("does not retry a non-404 client error", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(400, { message: "bad request" }),
      jsonResponse(200, { alias: "nope" }),
    ]);
    await assert.rejects(
      () => getJson("https://example.test/node", {}, opts(fetchImpl)),
      (err: unknown) => err instanceof UpstreamError && (err as UpstreamError).status === 400,
    );
    assert.equal(calls.length, 1);
  });

  it("retries a hung connection after the attempt times out", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = (_input, init) => {
      calls += 1;
      if (calls < 3) {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error("expected a timeout signal"));
            return;
          }
          if (signal.aborted) {
            reject(signal.reason ?? new Error("aborted"));
            return;
          }
          signal.addEventListener("abort", () => {
            reject(signal.reason ?? new Error("aborted"));
          });
        });
      }
      return Promise.resolve(jsonResponse(200, { alias: "recovered" }));
    };
    const data = await getJson<{ alias: string }>(
      "https://example.test/node",
      {},
      { fetchImpl, delaysMs: [0, 0], attempts: 3, timeoutMs: 30 },
    );
    assert.equal(data.alias, "recovered");
    assert.equal(calls, 3);
  });

  it("keeps a 500 body so a mempool node miss can be recognized", async () => {
    const { fetchImpl } = scripted([jsonResponse(500, { error: "Failed to get node" })]);
    await assert.rejects(
      () => getJson("https://example.test/node", {}, { fetchImpl, delaysMs: [0, 0], attempts: 1 }),
      (err: unknown) => isMempoolNodeMiss(err),
    );
  });

  it("treats a 200 with a non-JSON body as an upstream failure", async () => {
    const { fetchImpl } = scripted([new Response("<html>bad gateway</html>", { status: 200 })]);
    await assert.rejects(
      () => getJson("https://example.test/node", {}, opts(fetchImpl)),
      (err: unknown) =>
        err instanceof UpstreamError &&
        !isMissingResource(err) &&
        (err as UpstreamError).message.includes("non-JSON"),
    );
  });
});

describe("nodeDetailFailureOutcome", () => {
  const miss = new UpstreamError(
    "upstream 500: https://example.test/node",
    500,
    JSON.stringify({ error: "Failed to get node" }),
  );
  const outage = new UpstreamError("upstream 503", 503, "<html>");

  it("reads a mempool node miss from the 500 body", () => {
    assert.equal(isMempoolNodeMiss(miss), true);
    assert.equal(isMempoolNodeMiss(outage), false);
    assert.equal(isMempoolNodeMiss(new UpstreamError("upstream 500", 500, "nope")), false);
  });

  it("404s only when search agrees the 500 is a missing node", () => {
    assert.equal(nodeDetailFailureOutcome(miss, "missing"), "missing");
    assert.equal(nodeDetailFailureOutcome(miss, "present"), "throw");
    assert.equal(nodeDetailFailureOutcome(miss, "failed"), "throw");
    assert.equal(nodeDetailFailureOutcome(outage, "missing"), "throw");
    assert.equal(
      nodeDetailFailureOutcome(new MissingResourceError("https://example.test/missing"), "failed"),
      "missing",
    );
  });
});

function hangUntilAbort(init: RequestInit | undefined): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) {
      reject(new Error("expected an abort signal"));
      return;
    }
    if (signal.aborted) {
      reject(signal.reason ?? new Error("This operation was aborted"));
      return;
    }
    signal.addEventListener("abort", () => {
      reject(signal.reason ?? new Error("This operation was aborted"));
    });
  });
}

describe("mempoolProviderBases", () => {
  it("prefers the live emzy directory and keeps mempool.space as backup", () => {
    assert.deepEqual(mempoolProviderBases({}), [EMZY_BASE, SPACE_BASE]);
  });

  it("uses MEMPOOL_PROVIDERS in order when it is set", () => {
    assert.deepEqual(
      mempoolProviderBases({
        MEMPOOL_PROVIDERS: " https://mirror.example/api/v1, https://mempool.space/api/v1 ",
        NEXT_PUBLIC_MEMPOOL_BASE: EMZY_BASE,
      }),
      ["https://mirror.example/api/v1", SPACE_BASE],
    );
  });

  it("keeps a legacy public base as primary and appends the other instance", () => {
    assert.deepEqual(mempoolProviderBases({ NEXT_PUBLIC_MEMPOOL_BASE: SPACE_BASE }), [
      SPACE_BASE,
      EMZY_BASE,
    ]);
  });

  it("does not append a public backup onto a custom mirror", () => {
    assert.deepEqual(
      mempoolProviderBases({ NEXT_PUBLIC_MEMPOOL_BASE: "https://mirror.example/api/v1/" }),
      ["https://mirror.example/api/v1"],
    );
  });
});

describe("provider failover", () => {
  it("uses a few-second budget so one call cannot run for half a minute", () => {
    assert.equal(UPSTREAM_ATTEMPT_TIMEOUT_MS, 2_000);
    assert.equal(UPSTREAM_TOTAL_BUDGET_MS, 4_000);
    assert.ok(UPSTREAM_TOTAL_BUDGET_MS <= 5_000);
    assert.ok(UPSTREAM_ATTEMPT_TIMEOUT_MS * 2 <= UPSTREAM_TOTAL_BUDGET_MS);
  });

  it("returns the primary body without calling the backup", async () => {
    const { calls, fetchImpl } = scripted([jsonResponse(200, { alias: "primary" })]);
    const data = await getJsonFrom("/node", fetchImpl);
    assert.equal(data.alias, "primary");
    assert.equal(calls.length, 1);
    assert.match(calls[0], /^https:\/\/primary\.test/);
  });

  it("fails over immediately on 429", async () => {
    const seen: Array<{ url: string; revalidate?: number }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const revalidate = (init as { next?: { revalidate?: number } } | undefined)?.next?.revalidate;
      seen.push({ url, revalidate });
      if (url.includes("primary.test")) return jsonResponse(429, { message: "slow down" });
      return jsonResponse(200, { alias: "backup" });
    };
    const data = await getJsonFrom("/lightning/nodes/x", fetchImpl, 86_400);
    assert.equal(data.alias, "backup");
    assert.equal(seen.length, 2);
    assert.equal(seen[0]?.revalidate, 86_400);
    assert.equal(seen[1]?.revalidate, FALLBACK_REVALIDATE_CAP_SECONDS);
  });

  it("aborts a hung primary and uses the backup inside the attempt timeout", async () => {
    let calls = 0;
    const started = Date.now();
    const fetchImpl: typeof fetch = (input, init) => {
      calls += 1;
      if (String(input).includes("primary.test")) return hangUntilAbort(init);
      return Promise.resolve(jsonResponse(200, { alias: "backup" }));
    };
    const data = await fetchFromProviders("/node", {}, {
      bases: ["https://primary.test/api/v1", "https://backup.test/api/v1"],
      fetchImpl,
      attemptTimeoutMs: 40,
      totalBudgetMs: 500,
    }).then((res) => res.json() as Promise<{ alias: string }>);
    assert.equal(data.alias, "backup");
    assert.equal(calls, 2);
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 400, `failover took ${elapsed}ms`);
  });

  it("stops when the shared budget is exhausted instead of starting another full attempt", async () => {
    let calls = 0;
    const started = Date.now();
    const fetchImpl: typeof fetch = (_input, init) => {
      calls += 1;
      return hangUntilAbort(init);
    };
    await assert.rejects(
      () =>
        fetchFromProviders("/node", {}, {
          bases: ["https://primary.test/api/v1", "https://backup.test/api/v1"],
          fetchImpl,
          attemptTimeoutMs: 80,
          totalBudgetMs: 100,
        }),
      (err: unknown) => err instanceof UpstreamError,
    );
    assert.equal(calls, 1);
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 400, `budget overrun ${elapsed}ms`);
  });

  it("fails both hung providers within the total budget", async () => {
    let calls = 0;
    const started = Date.now();
    const fetchImpl: typeof fetch = (_input, init) => {
      calls += 1;
      return hangUntilAbort(init);
    };
    await assert.rejects(
      () =>
        fetchFromProviders("/node", {}, {
          bases: ["https://primary.test/api/v1", "https://backup.test/api/v1"],
          fetchImpl,
          attemptTimeoutMs: 50,
          totalBudgetMs: 200,
        }),
      (err: unknown) => err instanceof UpstreamError && !isMissingResource(err),
    );
    assert.equal(calls, 2);
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 500, `both providers took ${elapsed}ms`);
  });

  it("does not fail over a 404 or a node-miss 500", async () => {
    const missing = scripted([
      jsonResponse(404, { message: "nope" }),
      jsonResponse(200, { alias: "should-not-run" }),
    ]);
    await assert.rejects(
      () => getJsonFrom("/missing", missing.fetchImpl),
      (err: unknown) => isMissingResource(err),
    );
    assert.equal(missing.calls.length, 1);

    const miss = scripted([
      jsonResponse(500, { error: "Failed to get node" }),
      jsonResponse(200, { alias: "should-not-run" }),
    ]);
    await assert.rejects(
      () => getJsonFrom("/lightning/nodes/x", miss.fetchImpl),
      (err: unknown) => isMempoolNodeMiss(err),
    );
    assert.equal(miss.calls.length, 1);
  });

  it("does not fail over a non-retryable client error", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(400, { message: "bad" }),
      jsonResponse(200, { alias: "nope" }),
    ]);
    await assert.rejects(
      () => getJsonFrom("/node", fetchImpl),
      (err: unknown) => err instanceof UpstreamError && (err as UpstreamError).status === 400,
    );
    assert.equal(calls.length, 1);
  });
});

describe("resolveNodeDetail", () => {
  const pubkey = PUBKEY;

  it("404s a confirmed miss without calling the backup", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(500, { error: "Failed to get node" }),
      jsonResponse(200, []),
      jsonResponse(200, { alias: "backup" }),
    ]);
    await assert.rejects(
      () => nodeFrom(fetchImpl),
      (err: unknown) => isMissingResource(err),
    );
    assert.equal(calls.length, 2);
    assert.match(calls[1], /\/search\//);
    assert.ok(calls.every((url) => url.includes("primary.test")));
  });

  it("fails over on an abort without searching the dead host", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = (input, init) => {
      calls += 1;
      if (String(input).includes("primary.test")) return hangUntilAbort(init);
      return Promise.resolve(jsonResponse(200, { alias: "backup", public_key: pubkey }));
    };
    const started = Date.now();
    const node = await nodeFrom(fetchImpl, { attemptTimeoutMs: 40, totalBudgetMs: 400 });
    assert.equal(node.alias, "backup");
    assert.equal(calls, 2);
    assert.ok(Date.now() - started < 400);
  });

  it("tries the backup when search still sees the node", async () => {
    const { calls, fetchImpl } = scripted([
      jsonResponse(500, { error: "Failed to get node" }),
      jsonResponse(200, [{ public_key: pubkey }]),
      jsonResponse(200, { alias: "backup", public_key: pubkey }),
    ]);
    const node = await nodeFrom(fetchImpl);
    assert.equal(node.alias, "backup");
    assert.equal(calls.length, 3);
  });

  it("tries the backup when search itself fails", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = (input, init) => {
      calls += 1;
      const url = String(input);
      if (url.includes("primary.test") && url.includes("/search/")) return hangUntilAbort(init);
      if (url.includes("primary.test")) {
        return Promise.resolve(jsonResponse(500, { error: "Failed to get node" }));
      }
      return Promise.resolve(jsonResponse(200, { alias: "backup", public_key: pubkey }));
    };
    const node = await nodeFrom(fetchImpl, { attemptTimeoutMs: 40, totalBudgetMs: 400 });
    assert.equal(node.alias, "backup");
    assert.equal(calls, 3);
  });
});

function getJsonFrom(path: string, fetchImpl: typeof fetch, revalidate?: number) {
  return fetchFromProviders(path, {}, {
    bases: ["https://primary.test/api/v1", "https://backup.test/api/v1"],
    fetchImpl,
    revalidate,
    attemptTimeoutMs: 1_000,
    totalBudgetMs: 3_000,
  }).then((res) => res.json() as Promise<{ alias: string }>);
}

function nodeFrom(
  fetchImpl: typeof fetch,
  budget?: { attemptTimeoutMs: number; totalBudgetMs: number },
) {
  return resolveNodeDetail<{ alias: string }>(PUBKEY, {
    bases: ["https://primary.test/api/v1", "https://backup.test/api/v1"],
    fetchImpl,
    revalidate: 86_400,
    attemptTimeoutMs: budget?.attemptTimeoutMs ?? 1_000,
    totalBudgetMs: budget?.totalBudgetMs ?? 3_000,
  });
}

describe("nodePageDecision", () => {
  it("renders when the pubkey is real and the fetch succeeded", () => {
    assert.equal(nodePageDecision(PUBKEY), "render");
  });

  it("404s an impossible pubkey without caring about the fetch", () => {
    assert.equal(nodePageDecision("not-a-node"), "not-found");
    assert.equal(nodePageDecision("not-a-node", new UpstreamError("boom", 500)), "not-found");
  });

  it("404s only a genuine upstream miss", () => {
    assert.equal(
      nodePageDecision(PUBKEY, new MissingResourceError("https://example.test/missing")),
      "not-found",
    );
  });

  it("keeps an upstream failure off the not-found path", () => {
    for (const err of [
      new UpstreamError("upstream 503", 503),
      new UpstreamError("upstream 429", 429),
      new UpstreamError("upstream request failed: ECONNRESET"),
      new UpstreamError("https://example.test/node returned non-JSON", 200),
      new Error("unexpected"),
    ]) {
      assert.equal(nodePageDecision(PUBKEY, err), "unavailable");
    }
  });
});
