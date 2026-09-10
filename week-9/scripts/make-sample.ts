import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const WIDTH = 2400;
const HEIGHT = 1600;

async function main(): Promise<void> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#7c3aed"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    ${circles()}
    <text x="${WIDTH / 2}" y="${HEIGHT / 2}" font-family="Helvetica, sans-serif"
          font-size="150" font-weight="bold" fill="#ffffff" text-anchor="middle"
          opacity="0.9">Seminario 2026</text>
    <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 120}" font-family="Helvetica, sans-serif"
          font-size="70" fill="#ffffff" text-anchor="middle" opacity="0.75">week 9 — sample</text>
  </svg>`;

  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();

  await mkdir("assets", { recursive: true });
  await writeFile(join("assets", "sample.jpg"), buffer);

  const metadata = await sharp(buffer).metadata();
  console.log(
    `wrote assets/sample.jpg — ${metadata.width}x${metadata.height}, ${(
      buffer.byteLength / 1024
    ).toFixed(1)} KiB`,
  );
}

function circles(): string {
  const shapes: string[] = [];
  for (let i = 0; i < 40; i += 1) {
    const cx = ((i * 137) % WIDTH) + 40;
    const cy = ((i * 241) % HEIGHT) + 40;
    const r = 30 + ((i * 53) % 160);
    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.06"/>`,
    );
  }
  return shapes.join("\n    ");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
