/**
 * Normalize brand logos to PNG with transparent backgrounds.
 * Removes flat near-white / light-gray backdrop plates only — colored brand
 * fields (e.g. Milwaukee red, CAT yellow) are preserved so light artwork
 * stays visible on white shop surfaces.
 */

type Rgba = { r: number; g: number; b: number; a: number };

function colorDistance(a: Rgba, b: Rgba): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function luminance(p: Rgba): number {
  return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
}

function isLightBackdrop(p: Rgba): boolean {
  return (
    p.a > 200 &&
    luminance(p) >= 235 &&
    Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b) <= 28
  );
}

function readPixel(
  data: Buffer,
  width: number,
  channels: number,
  x: number,
  y: number,
): Rgba {
  const i = (y * width + x) * channels;
  return {
    r: data[i]!,
    g: data[i + 1]!,
    b: data[i + 2]!,
    a: channels > 3 ? data[i + 3]! : 255,
  };
}

function sampleLightBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): Rgba | null {
  const points: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
  ];

  const samples = points.map(([x, y]) => readPixel(data, width, channels, x, y));
  const light = samples.filter(isLightBackdrop);
  if (light.length < 3) return null;

  const seed = light[0]!;
  const agreed = light.filter((p) => colorDistance(p, seed) <= 28);
  if (agreed.length < 3) return null;

  const n = agreed.length;
  return {
    r: Math.round(agreed.reduce((sum, p) => sum + p.r, 0) / n),
    g: Math.round(agreed.reduce((sum, p) => sum + p.g, 0) / n),
    b: Math.round(agreed.reduce((sum, p) => sum + p.b, 0) / n),
    a: 255,
  };
}

function knockoutLightBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  background: Rgba,
): void {
  const hard = 42;
  const soft = 28;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const pixel: Rgba = {
        r: data[i]!,
        g: data[i + 1]!,
        b: data[i + 2]!,
        a: channels > 3 ? data[i + 3]! : 255,
      };
      if (pixel.a < 8) continue;
      // Never punch holes in saturated logo ink — only light plates.
      if (
        !isLightBackdrop({ ...pixel, a: 255 }) &&
        colorDistance(pixel, background) > 18
      ) {
        continue;
      }

      const dist = colorDistance(pixel, background);
      if (dist >= hard) continue;

      const fade = dist <= hard - soft ? 0 : (dist - (hard - soft)) / soft;
      const nextAlpha = Math.round(pixel.a * Math.min(1, Math.max(0, fade)));
      if (channels > 3) data[i + 3] = nextAlpha;
    }
  }
}

export async function prepareBrandLogo(
  input: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  if (contentType === "image/svg+xml") {
    return { buffer: input, contentType, extension: "svg" };
  }

  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const pixels = Buffer.from(data);

  const background = sampleLightBackground(pixels, width, height, channels);
  if (background) {
    knockoutLightBackground(pixels, width, height, channels, background);
  }

  const buffer = await sharp(pixels, {
    raw: { width, height, channels },
  })
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer, contentType: "image/png", extension: "png" };
}
