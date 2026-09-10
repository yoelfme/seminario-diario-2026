import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { type Preset, resizeToPresets } from "./resize.js";

const PRESETS: Preset[] = [
  { name: "thumb", width: 200 },
  { name: "medium", width: 800 },
  { name: "large", width: 1600 },
];

const OPTIONS = { quality: 80, maxInputPixels: 100_000_000 };

async function makeJpeg(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe("resizeToPresets", () => {
  let source: Buffer;

  beforeAll(async () => {
    source = await makeJpeg(2400, 1200);
  });

  it("produces one derivative per preset", async () => {
    const derivatives = await resizeToPresets(source, PRESETS, OPTIONS);
    expect(derivatives.map((d) => d.preset)).toEqual(["thumb", "medium", "large"]);
  });

  it("emits valid webp at the requested widths", async () => {
    const derivatives = await resizeToPresets(source, PRESETS, OPTIONS);

    for (const derivative of derivatives) {
      const metadata = await sharp(derivative.body).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(derivative.width);
      expect(metadata.height).toBe(derivative.height);
    }

    expect(derivatives.map((d) => d.width)).toEqual([200, 800, 1600]);
  });

  it("preserves aspect ratio", async () => {
    const derivatives = await resizeToPresets(source, PRESETS, OPTIONS);
    for (const derivative of derivatives) {
      expect(derivative.width / derivative.height).toBeCloseTo(2, 5);
    }
  });

  it("never upscales an original smaller than the preset", async () => {
    const small = await makeJpeg(300, 150);
    const derivatives = await resizeToPresets(small, PRESETS, OPTIONS);

    expect(derivatives[0]?.width).toBe(200);
    expect(derivatives[1]?.width).toBe(300);
    expect(derivatives[2]?.width).toBe(300);
  });

  it("applies EXIF orientation before resizing", async () => {
    const rotated = await sharp({
      create: {
        width: 1000,
        height: 500,
        channels: 3,
        background: { r: 10, g: 200, b: 90 },
      },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    const [thumb] = await resizeToPresets(rotated, [{ name: "thumb", width: 200 }], OPTIONS);

    expect(thumb?.width).toBe(200);
    expect(thumb?.height).toBe(400);
  });

  it("rejects input above the pixel limit", async () => {
    await expect(
      resizeToPresets(source, PRESETS, { ...OPTIONS, maxInputPixels: 1000 }),
    ).rejects.toThrow();
  });
});
