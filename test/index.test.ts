import test, { describe } from "node:test";
import assert from "node:assert";
import { RawTest, TestEndpoint } from "./raw-test";
import { Router } from "../router";

const testEndpoints: TestEndpoint[] = [
  {
    handler: (req) => {
      return JSON.stringify({ message: "hi" });
    },
    method: "GET",
    route: "/test/route",
  },
  {
    handler: (req) => {
      return JSON.stringify({
        body: req.body,
        params: req.params,
        headers: req.headers,
      });
    },
    method: "POST",
    route: "/test/route/$id",
  },
];

const router = new Router(testEndpoints);
const raw = new RawTest(router);

describe("router", () => {
  test("endpoint is requestable", () => {
    assert.ok(router.requestEndpoint("GET", "/test/route"));
    assert.equal(router.requestEndpoint("DELETE", "/test/route"), undefined);
  });

  test("params are accessible", () => {
    const params = router.getReqParams("/test/123", "/test/$id");

    assert.equal(params?.id, "123");
  });

  test("endpoint is addable", () => {
    router.addEndpoint({
      handler: (req) => JSON.stringify({ message: "test" }),
      method: "DELETE",
      route: "/",
    });

    assert.ok(router.requestEndpoint("GET", "/test/route"));
  });
});

describe("raw", () => {
  test("endpoint with repeated params is not settable", () => {
    assert.throws(
      () => {
        raw.set("GET", "/test/$param1/$param2/$param1", (req) => {
          return JSON.stringify(true);
        });
      },
      { message: "Endpoint parameters must be uniquely named." }
    );
  });

  test("routing system is successful", () => {
    const response = raw.fetch("/test/route");
    const data = JSON.parse(response);

    assert.strictEqual(JSON.stringify(data), JSON.stringify({ message: "hi" }));
  });

  test("non-existing endpoint is not fetchable", () => {
    assert.throws(
      () => {
        raw.fetch("/unexisting/endpoint");
      },
      { message: "404" }
    );
  });

  test("params, body and headers are accessible", () => {
    const response = raw.fetch("/test/route/123", {
      body: JSON.stringify({ test: "hi" }),
      method: "POST",
      headers: { "test-header": "hi", "test-again": "hi-again" },
    });
    const data = JSON.parse(response);

    assert.strictEqual(
      JSON.stringify(data),
      JSON.stringify({
        body: { test: "hi" },
        params: { id: "123" },
        headers: { "test-header": "hi", "test-again": "hi-again" },
      })
    );
  });
});
