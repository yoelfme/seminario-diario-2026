import sharp from "sharp";

sharp.cache(false);
sharp.concurrency(1);

export type Preset = {
  name: string;
  width: number;
};

export type Derivative = {
  preset: string;
  body: Buffer;
  width: number;
  height: number;
};

export type ResizeOptions = {
  quality: number;
  maxInputPixels: number;
};

export async function resizeToPresets(
  input: Buffer,
  presets: readonly Preset[],
  options: ResizeOptions,
): Promise<Derivative[]> {
  const pipeline = sharp(input, { limitInputPixels: options.maxInputPixels }).rotate();

  return Promise.all(
    presets.map(async (preset): Promise<Derivative> => {
      const { data, info } = await pipeline
        .clone()
        .resize({ width: preset.width, fit: "inside", withoutEnlargement: true })
        .webp({ quality: options.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      return {
        preset: preset.name,
        body: data,
        width: info.width,
        height: info.height,
      };
    }),
  );
}
