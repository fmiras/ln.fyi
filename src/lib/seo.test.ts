import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { siteVerification } from "./seo.ts";

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