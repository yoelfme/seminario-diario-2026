import * as aws from "@pulumi/aws";
import type { Settings } from "./config.js";

export function wireNotification(
  name: string,
  bucket: aws.s3.Bucket,
  fn: aws.lambda.Function,
  settings: Settings,
): void {
  const identity = aws.getCallerIdentityOutput({});

  const permission = new aws.lambda.Permission(`${name}-invoke-permission`, {
    statementId: "AllowExecutionFromS3Bucket",
    action: "lambda:InvokeFunction",
    function: fn.name,
    principal: "s3.amazonaws.com",
    sourceArn: bucket.arn,
    sourceAccount: identity.accountId,
  });

  new aws.s3.BucketNotification(
    `${name}-notification`,
    {
      bucket: bucket.id,
      lambdaFunctions: [
        {
          lambdaFunctionArn: fn.arn,
          events: ["s3:ObjectCreated:*"],
          filterPrefix: settings.srcPrefix,
        },
      ],
    },
    { dependsOn: [permission] },
  );
}
