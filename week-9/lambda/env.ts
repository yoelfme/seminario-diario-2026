import { z } from "zod";

const presetSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
});

const presetsSchema = presetSchema.array().min(1);

const envSchema = z.object({
  SRC_PREFIX: z.string().default("originals/"),
  DEST_PREFIX: z.string().default("resized/"),
  PRESETS: z.string().transform((raw) => presetsSchema.parse(JSON.parse(raw))),
  WEBP_QUALITY: z.coerce.number().int().min(1).max(100).default(80),
  MAX_INPUT_PIXELS: z.coerce.number().int().positive().default(100_000_000),
});

export type Env = z.infer<typeof envSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
