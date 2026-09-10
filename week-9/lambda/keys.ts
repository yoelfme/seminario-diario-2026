export type OutputKey = {
  preset: string;
  key: string;
};

export function decodeEventKey(rawKey: string): string {
  return decodeURIComponent(rawKey.replace(/\+/g, " "));
}

export function isEligible(key: string, srcPrefix: string): boolean {
  if (!key.startsWith(srcPrefix)) return false;
  if (key.endsWith("/")) return false;
  return key.length > srcPrefix.length;
}

export function toOutputKey(
  srcKey: string,
  presetName: string,
  srcPrefix: string,
  destPrefix: string,
): string {
  const relative = srcKey.slice(srcPrefix.length);
  const withoutExtension = relative.replace(/\.[^./]+$/, "");
  return `${destPrefix}${presetName}/${withoutExtension}.webp`;
}
