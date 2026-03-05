export type ShaderColor = readonly [number, number, number, number];

const HEX6_REGEX = /^#([0-9a-fA-F]{6})$/;

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
