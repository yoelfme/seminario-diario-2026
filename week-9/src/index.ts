import { createBucket } from "./bucket.js";
import { readSettings, resourcePrefix } from "./config.js";
import { createResizer } from "./lambda.js";
import { wireNotification } from "./notification.js";

const settings = readSettings();
const name = resourcePrefix();

const bucket = createBucket(`${name}-images`, settings);
const { fn, dlq, logGroup } = createResizer(`${name}-resizer`, bucket, settings);

wireNotification(name, bucket, fn, settings);

export const bucketName = bucket.id;
export const functionName = fn.name;
export const logGroupName = logGroup.name;
export const dlqUrl = dlq.url;
export const srcPrefix = settings.srcPrefix;
export const destPrefix = settings.destPrefix;
