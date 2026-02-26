import {
  ARC_START_DEG,
  ARC_SWEEP_DEG,
  CANVAS_SIZE,
  INNER_RADIUS,
  OUTER_RADIUS,
} from "./styles";

const DEG_TO_RAD = Math.PI / 180;
const FRAME_COUNT = 60;
const DIVIDER_ANGLE_DEG = ARC_START_DEG + ARC_SWEEP_DEG / 2;

function buildArcBandSVG(sweepDeg: number): string {
  if (sweepDeg < 0.5) return "";

  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const oR = OUTER_RADIUS;
  const iR = INNER_RADIUS;
  const startRad = ARC_START_DEG * DEG_TO_RAD;
  const endRad = (ARC_START_DEG + sweepDeg) * DEG_TO_RAD;

  const outerStartX = cx + oR * Math.cos(startRad);
  const outerStartY = cy + oR * Math.sin(startRad);
  const outerEndX = cx + oR * Math.cos(endRad);
  const outerEndY = cy + oR * Math.sin(endRad);
  const innerEndX = cx + iR * Math.cos(endRad);
  const innerEndY = cy + iR * Math.sin(endRad);
  const innerStartX = cx + iR * Math.cos(startRad);
  const innerStartY = cy + iR * Math.sin(startRad);

  const largeFlag = sweepDeg > 180 ? 1 : 0;

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${oR} ${oR} 0 ${largeFlag} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${iR} ${iR} 0 ${largeFlag} 0 ${innerStartX} ${innerStartY}`,
    "Z",
  ].join(" ");
}

function buildDividerSVG(): string {
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const angleRad = DIVIDER_ANGLE_DEG * DEG_TO_RAD;

  const innerX = cx + INNER_RADIUS * Math.cos(angleRad);
  const innerY = cy + INNER_RADIUS * Math.sin(angleRad);
  const outerX = cx + OUTER_RADIUS * Math.cos(angleRad);
  const outerY = cy + OUTER_RADIUS * Math.sin(angleRad);

  return `M ${innerX} ${innerY} L ${outerX} ${outerY}`;
}

function buildFrames(): string[] {
  const frames: string[] = [];
  for (let i = 0; i <= FRAME_COUNT; i++) {
    const sweep = (i / FRAME_COUNT) * ARC_SWEEP_DEG;
    frames.push(buildArcBandSVG(sweep));
  }
  return frames;
}

export const ARC_FRAMES = buildFrames();
export const DIVIDER_PATH = buildDividerSVG();
export const DIVIDER_FRAME_THRESHOLD = Math.ceil(FRAME_COUNT / 2);
export { FRAME_COUNT };
