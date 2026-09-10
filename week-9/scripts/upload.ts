import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client, readStackOutputs } from "./stack.js";

async function main(): Promise<void> {
  const outputs = readStackOutputs();
  const s3 = createS3Client();
  const file = process.argv[2] ?? join("assets", "sample.jpg");
  const key = `${outputs.srcPrefix}${basename(file)}`;
  const body = await readFile(file);

  await s3.send(
    new PutObjectCommand({
      Bucket: outputs.bucketName,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(file),
    }),
  );

  console.log(`uploaded ${formatBytes(body.byteLength)} to s3://${outputs.bucketName}/${key}`);
  console.log("run `pnpm demo:inspect` to see the derivatives appear");
}

function contentTypeFor(file: string): string {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
