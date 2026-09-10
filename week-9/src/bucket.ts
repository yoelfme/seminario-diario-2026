import * as aws from "@pulumi/aws";
import type { Settings } from "./config.js";

export function createBucket(name: string, settings: Settings): aws.s3.Bucket {
  const bucket = new aws.s3.Bucket(name, {
    bucketPrefix: `${name}-`,
    forceDestroy: true,
  });

  new aws.s3.BucketPublicAccessBlock(`${name}-access-block`, {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
    bucket: bucket.id,
    rules: [
      {
        applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" },
        bucketKeyEnabled: true,
      },
    ],
  });

  new aws.s3.BucketLifecycleConfiguration(`${name}-lifecycle`, {
    bucket: bucket.id,
    rules: [
      {
        id: "expire-originals",
        status: "Enabled",
        filter: { prefix: settings.srcPrefix },
        expiration: { days: settings.originalsExpirationDays },
      },
      {
        id: "abort-incomplete-uploads",
        status: "Enabled",
        filter: {},
        abortIncompleteMultipartUpload: { daysAfterInitiation: 1 },
      },
    ],
  });

  return bucket;
}
