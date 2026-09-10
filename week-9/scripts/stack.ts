import { execFileSync } from "node:child_process";
import { S3Client } from "@aws-sdk/client-s3";

export type StackOutputs = {
  bucketName: string;
  functionName: string;
  logGroupName: string;
  dlqUrl: string;
  srcPrefix: string;
  destPrefix: string;
};

export function readStackOutputs(): StackOutputs {
  const raw = execFileSync("pulumi", ["stack", "output", "--json"], {
    encoding: "utf8",
  });

  const outputs = JSON.parse(raw) as Partial<StackOutputs>;

  if (!outputs.bucketName) {
    throw new Error("no bucketName output — run `pnpm deploy:up` first");
  }

  return outputs as StackOutputs;
}

export function createS3Client(): S3Client {
  const profile = resolveProfile();
  if (profile) {
    process.env.AWS_PROFILE = profile;
  }
  return new S3Client({});
}

function resolveProfile(): string | undefined {
  if (process.env.AWS_PROFILE) return process.env.AWS_PROFILE;

  try {
    const value = execFileSync("pulumi", ["config", "get", "aws:profile"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}
