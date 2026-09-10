import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { Settings } from "./config.js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = join(projectRoot, "build", "lambda");

export type Resizer = {
  fn: aws.lambda.Function;
  dlq: aws.sqs.Queue;
  logGroup: aws.cloudwatch.LogGroup;
};

export function createResizer(
  name: string,
  bucket: aws.s3.Bucket,
  settings: Settings,
): Resizer {
  const functionName = name;

  const dlq = new aws.sqs.Queue(`${name}-dlq`, {
    name: `${name}-dlq`,
    messageRetentionSeconds: 1_209_600,
  });

  const logGroup = new aws.cloudwatch.LogGroup(`${name}-logs`, {
    name: `/aws/lambda/${functionName}`,
    retentionInDays: settings.logRetentionDays,
  });

  const role = new aws.iam.Role(`${name}-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "lambda.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
  });

  new aws.iam.RolePolicy(`${name}-policy`, {
    role: role.id,
    policy: pulumi
      .all([bucket.arn, logGroup.arn, dlq.arn])
      .apply(([bucketArn, logGroupArn, dlqArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "ReadOriginals",
              Effect: "Allow",
              Action: ["s3:GetObject"],
              Resource: `${bucketArn}/${settings.srcPrefix}*`,
            },
            {
              Sid: "WriteResized",
              Effect: "Allow",
              Action: ["s3:PutObject"],
              Resource: `${bucketArn}/${settings.destPrefix}*`,
            },
            {
              Sid: "WriteLogs",
              Effect: "Allow",
              Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
              Resource: `${logGroupArn}:*`,
            },
            {
              Sid: "SendToDlq",
              Effect: "Allow",
              Action: ["sqs:SendMessage"],
              Resource: dlqArn,
            },
          ],
        }),
      ),
  });

  const fn = new aws.lambda.Function(
    name,
    {
      name: functionName,
      role: role.arn,
      runtime: aws.lambda.Runtime.NodeJS24dX,
      architectures: ["arm64"],
      handler: "index.handler",
      code: new pulumi.asset.FileArchive(packageDir),
      memorySize: settings.memorySize,
      timeout: settings.timeout,
      loggingConfig: {
        logFormat: "JSON",
        logGroup: logGroup.name,
      },
      environment: {
        variables: {
          SRC_PREFIX: settings.srcPrefix,
          DEST_PREFIX: settings.destPrefix,
          PRESETS: JSON.stringify(settings.presets),
          WEBP_QUALITY: String(settings.webpQuality),
          MAX_INPUT_PIXELS: String(settings.maxInputPixels),
        },
      },
    },
    { dependsOn: [logGroup] },
  );

  new aws.lambda.FunctionEventInvokeConfig(`${name}-invoke-config`, {
    functionName: fn.name,
    maximumRetryAttempts: 2,
    destinationConfig: {
      onFailure: { destination: dlq.arn },
    },
  });

  return { fn, dlq, logGroup };
}
