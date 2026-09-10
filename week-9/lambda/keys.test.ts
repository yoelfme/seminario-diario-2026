import { describe, expect, it } from "vitest";
import { decodeEventKey, isEligible, toOutputKey } from "./keys.js";

const SRC = "originals/";
const DEST = "resized/";

describe("decodeEventKey", () => {
  it("decodes percent-encoded characters", () => {
    expect(decodeEventKey("originals/caf%C3%A9.jpg")).toBe("originals/café.jpg");
  });

  it("decodes plus signs as spaces", () => {
    expect(decodeEventKey("originals/my+photo.jpg")).toBe("originals/my photo.jpg");
  });

  it("leaves plain keys untouched", () => {
    expect(decodeEventKey("originals/photos/cat.jpg")).toBe("originals/photos/cat.jpg");
  });
});

describe("isEligible", () => {
  it("accepts a key under the source prefix", () => {
    expect(isEligible("originals/cat.jpg", SRC)).toBe(true);
  });

  it("rejects output keys, which is the recursion guard", () => {
    expect(isEligible("resized/thumb/cat.webp", SRC)).toBe(false);
  });

  it("rejects folder markers", () => {
    expect(isEligible("originals/photos/", SRC)).toBe(false);
  });

  it("rejects the bare prefix", () => {
    expect(isEligible("originals/", SRC)).toBe(false);
  });
});

describe("toOutputKey", () => {
  it("swaps prefix, inserts preset, and rewrites the extension", () => {
    expect(toOutputKey("originals/photos/cat.jpg", "thumb", SRC, DEST)).toBe(
      "resized/thumb/photos/cat.webp",
    );
  });

  it("preserves nested paths", () => {
    expect(toOutputKey("originals/a/b/c.png", "large", SRC, DEST)).toBe(
      "resized/large/a/b/c.webp",
    );
  });

  it("appends the extension when the original has none", () => {
    expect(toOutputKey("originals/noext", "medium", SRC, DEST)).toBe(
      "resized/medium/noext.webp",
    );
  });

  it("only rewrites the final extension", () => {
    expect(toOutputKey("originals/my.photo.v2.jpeg", "thumb", SRC, DEST)).toBe(
      "resized/thumb/my.photo.v2.webp",
    );
  });
});
