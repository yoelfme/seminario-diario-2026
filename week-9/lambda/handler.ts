import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import { readEnv } from "./env.js";
import { decodeEventKey, isEligible, toOutputKey } from "./keys.js";
import { resizeToPresets } from "./resize.js";

const s3 = new S3Client({});
const env = readEnv();

export async function handler(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeEventKey(record.s3.object.key);

    if (!isEligible(key, env.SRC_PREFIX)) {
      console.log(JSON.stringify({ msg: "skipped", bucket, key }));
      continue;
    }

    await processObject(bucket, key);
  }
}

async function processObject(bucket: string, key: string): Promise<void> {
  const startedAt = Date.now();

  const source = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!source.Body) {
    throw new Error(`empty body for s3://${bucket}/${key}`);
  }

  const input = Buffer.from(await source.Body.transformToByteArray());
  const derivatives = await resizeToPresets(input, env.PRESETS, {
    quality: env.WEBP_QUALITY,
    maxInputPixels: env.MAX_INPUT_PIXELS,
  });

  await Promise.all(
    derivatives.map((derivative) =>
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: toOutputKey(key, derivative.preset, env.SRC_PREFIX, env.DEST_PREFIX),
          Body: derivative.body,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: { "source-key": key, preset: derivative.preset },
        }),
      ),
    ),
  );

  console.log(
    JSON.stringify({
      msg: "resized",
      bucket,
      key,
      bytesIn: input.byteLength,
      outputs: derivatives.map((derivative) => ({
        preset: derivative.preset,
        width: derivative.width,
        height: derivative.height,
        bytesOut: derivative.body.byteLength,
      })),
      ms: Date.now() - startedAt,
    }),
  );
}
