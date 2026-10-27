import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absoluteUrl, buildMetadata, deploymentOrigin, siteVerification } from "./seo.ts";

describe("siteVerification", () => {
  it("omits the metadata field when neither token is set", () => {
    assert.equal(siteVerification({}), undefined);
    assert.equal(
      siteVerification({
        GOOGLE_SITE_VERIFICATION: "  ",
        BING_SITE_VERIFICATION: "",
      }),
      undefined,
    );
  });

  it("emits Google and Bing tags only for the tokens that are set", () => {
    assert.deepEqual(siteVerification({ GOOGLE_SITE_VERIFICATION: " g-token " }), {
      google: "g-token",
    });
    assert.deepEqual(siteVerification({ BING_SITE_VERIFICATION: "b-token" }), {
      other: { "msvalidate.01": "b-token" },
    });
    assert.deepEqual(
      siteVerification({
        GOOGLE_SITE_VERIFICATION: "g-token",
        BING_SITE_VERIFICATION: "b-token",
      }),
      {
        google: "g-token",
        other: { "msvalidate.01": "b-token" },
      },
    );
  });
});

describe("buildMetadata images", () => {
  it("omits the images key when no card is passed, so file images can merge", () => {
    const meta = buildMetadata({
      title: "Nodes",
      description: "Directory",
      path: "/nodes",
    });
    assert.equal(Object.prototype.hasOwnProperty.call(meta.openGraph, "images"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(meta.twitter, "images"), false);
  });

  it("emits an absolute png with width and height for og and twitter", () => {
    const meta = buildMetadata({
      title: "ACINQ — A+",
      description: "Report card",
      path: "/nodes/abc",
      image: "https://ln.fyi/nodes/abc/opengraph-image",
    });
    const og = meta.openGraph?.images;
    const tw = meta.twitter?.images;
    assert.ok(Array.isArray(og));
    assert.ok(Array.isArray(tw));
    const ogImage = og[0];
    const twImage = tw[0];
    assert.equal(typeof ogImage, "object");
    assert.equal(typeof twImage, "object");
    if (!ogImage || typeof ogImage === "string" || ogImage instanceof URL) {
      throw new Error("expected an og image descriptor");
    }
    if (!twImage || typeof twImage === "string" || twImage instanceof URL) {
      throw new Error("expected a twitter image descriptor");
    }
    assert.equal(ogImage.url, "https://ln.fyi/nodes/abc/opengraph-image");
    assert.equal(ogImage.width, 1200);
    assert.equal(ogImage.height, 630);
    assert.equal(ogImage.type, "image/png");
    assert.equal(twImage.url, ogImage.url);
    assert.equal(twImage.width, 1200);
    assert.equal(twImage.height, 630);
  });

  it("keeps share images on ln.fyi in production and on the preview host otherwise", () => {
    const env = process.env.VERCEL_ENV;
    const branch = process.env.VERCEL_BRANCH_URL;
    const url = process.env.VERCEL_URL;
    try {
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_BRANCH_URL;
      delete process.env.VERCEL_URL;
      assert.equal(deploymentOrigin(), "https://ln.fyi");
      assert.equal(absoluteUrl("/grades/opengraph-image"), "https://ln.fyi/grades/opengraph-image");

      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_BRANCH_URL = "preview.example.vercel.app";
      assert.equal(absoluteUrl("/nodes/abc/opengraph-image"), "https://ln.fyi/nodes/abc/opengraph-image");

      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_BRANCH_URL = "lnfyi-git-example.vercel.app";
      assert.equal(
        absoluteUrl("/grades/opengraph-image"),
        "https://lnfyi-git-example.vercel.app/grades/opengraph-image",
      );
    } finally {
      if (env === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = env;
      if (branch === undefined) delete process.env.VERCEL_BRANCH_URL;
      else process.env.VERCEL_BRANCH_URL = branch;
      if (url === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = url;
    }
  });
});