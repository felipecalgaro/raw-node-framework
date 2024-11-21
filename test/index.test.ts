import test, { describe } from "node:test";
import assert from "node:assert";
import { RawTestRepository } from "./raw-test-repository";

const raw = new RawTestRepository();

describe("routing", () => {
  test("routing system is successful", () => {
    raw.set("GET", "/test/route", (req) => {
      return JSON.stringify({ message: "hi" });
    });

    const response = raw.fetch("/test/route");
    const data = JSON.parse(response);

    assert.strictEqual(JSON.stringify(data), JSON.stringify({ message: "hi" }));
  });

  test("params, body and headers are accessible", () => {
    raw.set("POST", "/test/route/$id", (req) => {
      return JSON.stringify({
        body: req.body,
        params: req.params,
        headers: req.headers,
      });
    });

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
