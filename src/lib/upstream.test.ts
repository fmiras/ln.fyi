import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MissingResourceError,
  UpstreamError,
  getJson,
  isMissingResource,
  nodePageDecision,
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

  it("asks the page to throw on upstream failure so ISR does not cache a 404", () => {
    for (const err of [
      new UpstreamError("upstream 503", 503),
      new UpstreamError("upstream 429", 429),
      new UpstreamError("upstream request failed: ECONNRESET"),
      new UpstreamError("https://example.test/node returned non-JSON", 200),
      new Error("unexpected"),
    ]) {
      assert.equal(nodePageDecision(PUBKEY, err), "error");
    }
  });
});
