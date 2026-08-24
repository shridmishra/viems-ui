import { describe, it } from "node:test";
import assert from "node:assert";
import { getSafeString } from "./utils.ts";

describe("getSafeString", () => {
  it("should handle null and undefined with fallback", () => {
    assert.strictEqual(getSafeString(null), "");
    assert.strictEqual(getSafeString(undefined, "default"), "default");
  });

  it("should handle string and number inputs", () => {
    assert.strictEqual(getSafeString("hello"), "hello");
    assert.strictEqual(getSafeString(42), "42");
  });

  it("should handle arrays of strings/numbers/objects", () => {
    assert.strictEqual(getSafeString(["item1", "item2"]), "item1, item2");
    assert.strictEqual(getSafeString([{ name: "Doc1" }, { title: "Doc2" }]), "Doc1, Doc2");
  });

  it("should handle simple object structures", () => {
    assert.strictEqual(getSafeString({ title: "Upload CoS" }), "Upload CoS");
    assert.strictEqual(getSafeString({ name: "Passport" }), "Passport");
    assert.strictEqual(getSafeString({ label: "High Priority" }), "High Priority");
    assert.strictEqual(getSafeString({ value: "Completed" }), "Completed");
  });

  it("should recursively normalize nested object candidates", () => {
    assert.strictEqual(getSafeString({ title: { label: "Upload CoS" } }), "Upload CoS");
    assert.strictEqual(getSafeString({ name: { title: { value: "Nested Title" } } }), "Nested Title");
  });
});
