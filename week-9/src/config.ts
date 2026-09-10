import * as pulumi from "@pulumi/pulumi";
import { z } from "zod";

const presetSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
});

export type Preset = z.infer<typeof presetSchema>;

export type Settings = {
  srcPrefix: string;
  destPrefix: string;
  presets: Preset[];
  webpQuality: number;
  maxInputPixels: number;
  memorySize: number;
  timeout: number;
  logRetentionDays: number;
  originalsExpirationDays: number;
};

export function readSettings(): Settings {
  const config = new pulumi.Config();

  const presets = presetSchema
    .array()
    .min(1)
    .parse(JSON.parse(config.get("presets") ?? "[]"));

  return {
    srcPrefix: config.get("srcPrefix") ?? "originals/",
    destPrefix: config.get("destPrefix") ?? "resized/",
    presets,
    webpQuality: config.getNumber("webpQuality") ?? 80,
    maxInputPixels: config.getNumber("maxInputPixels") ?? 100_000_000,
    memorySize: config.getNumber("memorySize") ?? 1536,
    timeout: config.getNumber("timeout") ?? 30,
    logRetentionDays: config.getNumber("logRetentionDays") ?? 14,
    originalsExpirationDays: config.getNumber("originalsExpirationDays") ?? 7,
  };
}

export function resourcePrefix(): string {
  return `${pulumi.getProject()}-${pulumi.getStack()}`;
}
