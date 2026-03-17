export type ShaderColor = readonly [number, number, number, number];

const RGBA_REGEX = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/;
const HEX3_REGEX = /^#([0-9a-fA-F]{3})$/;
const HEX6_REGEX = /^#([0-9a-fA-F]{6})$/;
const HEX8_REGEX = /^#([0-9a-fA-F]{8})$/;

function parseRgb(color: string): [number, number, number] | null {
  const rgbaMatch = RGBA_REGEX.exec(color);
  if (rgbaMatch) {
    return [
      Number(rgbaMatch[1]),
      Number(rgbaMatch[2]),
      Number(rgbaMatch[3]),
    ];
  }

  const hex6Match = HEX6_REGEX.exec(color);
  if (hex6Match) {
    const h = hex6Match[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const hex8Match = HEX8_REGEX.exec(color);
  if (hex8Match) {
    const h = hex8Match[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const hex3Match = HEX3_REGEX.exec(color);
  if (hex3Match) {
    const h = hex3Match[1];
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }

  return null;
}

export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const rgb = parseRgb(color);

  if (rgb) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamped})`;
  }

  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}

export function getLuminance(color: string): number {
  const rgb = parseRgb(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function adjustBrightness(color: string, amount: number): string {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  const adjusted = rgb.map((c) =>
    Math.max(0, Math.min(255, Math.round(c + amount))),
  );
  return `#${adjusted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function rgbaToHex(color: string): string {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function normalizedToHex(color: readonly [number, number, number, number]): string {
  const r = Math.round(color[0] * 255).toString(16).padStart(2, "0");
  const g = Math.round(color[1] * 255).toString(16).padStart(2, "0");
  const b = Math.round(color[2] * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function hexToNormalized4(hex: string): readonly [number, number, number, number] {
  const rgb = parseRgb(hex);
  if (!rgb) return [0, 0, 0, 1.0];
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1.0];
}

export function hexToShaderColor(hex: string, alpha: number = 1.0): ShaderColor {
  const match = HEX6_REGEX.exec(hex);
  if (!match) {
    return [0, 0, 0, alpha];
  }
  const h = match[1];
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
    alpha,
  ];
}
