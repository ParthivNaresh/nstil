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
