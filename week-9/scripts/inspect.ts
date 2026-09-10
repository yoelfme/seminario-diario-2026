import {
  GetObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { createS3Client, readStackOutputs } from "./stack.js";

const TIMEOUT_MS = 30_000;
const POLL_MS = 2_000;

type Item = {
  key: string;
  bytes: number;
};

async function main(): Promise<void> {
  const outputs = readStackOutputs();
  const s3 = createS3Client();

  const originals = await listPrefix(s3, outputs.bucketName, outputs.srcPrefix);

  if (originals.length === 0) {
    console.log(`nothing under ${outputs.srcPrefix} — run \`pnpm demo:upload\` first`);
    return;
  }

  const derivatives = await waitForDerivatives(s3, outputs.bucketName, outputs.destPrefix);

  if (derivatives.length === 0) {
    console.log(`no derivatives after 30s — check \`aws logs tail ${outputs.logGroupName}\``);
    process.exitCode = 1;
    return;
  }

  const rows = await Promise.all(
    derivatives.map(async (item) => {
      const body = await getObject(s3, outputs.bucketName, item.key);
      const metadata = await sharp(body).metadata();
      return {
        key: item.key,
        size: formatBytes(item.bytes),
        dimensions: `${metadata.width}x${metadata.height}`,
      };
    }),
  );

  console.table(rows);

  const originalBytes = sumBytes(originals);
  const derivativeBytes = sumBytes(derivatives);

  console.log(`originals   ${originals.length} object(s), ${formatBytes(originalBytes)}`);
  console.log(`derivatives ${derivatives.length} object(s), ${formatBytes(derivativeBytes)}`);
  console.log(
    `total change ${(((derivativeBytes - originalBytes) / originalBytes) * 100).toFixed(1)}%`,
  );
}

async function waitForDerivatives(
  s3: S3Client,
  bucket: string,
  prefix: string,
): Promise<Item[]> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const found = await listPrefix(s3, bucket, prefix);
    if (found.length > 0) return found;
    await sleep(POLL_MS);
  }

  return [];
}

async function listPrefix(s3: S3Client, bucket: string, prefix: string): Promise<Item[]> {
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
  );

  return (response.Contents ?? []).map((object) => ({
    key: object.Key ?? "",
    bytes: object.Size ?? 0,
  }));
}

async function getObject(s3: S3Client, bucket: string, key: string): Promise<Buffer> {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error(`empty body for ${key}`);
  return Buffer.from(await response.Body.transformToByteArray());
}

function sumBytes(items: Item[]): number {
  return items.reduce((total, item) => total + item.bytes, 0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
