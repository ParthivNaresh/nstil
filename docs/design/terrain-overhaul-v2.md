# Design Document: Terrain Overhaul v2

**Author:** Systems Architect | **Status:** Draft | **Scope:** Step 11, Phase 7B

---

## 1. Problem Statement

Six specific failures in the current terrain implementation:

### 1.1 Shape reads as sine waves, not mountains

`terrainCurve.ts` `getHarmonicHeight` uses `ridge * ridge` (hardcoded exponent 2) with low `ridgeBlend` (0.12-0.45). Output barely differs from raw sine sum. Every layer uses k=1 as dominant harmonic. With `terrainLoopWidth: 1200`, k=1 = one peak per loop. On ~393px screen, half the terrain is flat valley.

### 1.2 Terrain fills bottom half, no foreground room

baseHeights: 0.48/0.58/0.68/0.78/0.86. NEAR at 0.86 with 65px amplitude = terrain from ~48% to 100%. Reference: sky 0-55%, mountains 30-75%, water 75-100%.

### 1.3 Visible loop repetition

All layers share `terrainLoopWidth: 1200`. Scene repeats every 20s. All layers reset simultaneously.

### 1.4 Flat solid color per layer

`TerrainLayers.tsx` fills each Path with single flat color. Reference shows vertical gradients within each layer.

### 1.5 Near-silhouette colors too dark

Current: `#1A0E08`, `#0E1A28`, `#0E0A1E`, `#050510` (near-black). Reference shows deep purple/indigo.

### 1.6 Reference comparison table

| Aspect | Reference | Current |
|--------|-----------|---------|
| Ridgeline shape | Asymmetric peaks, flat valleys | Symmetric sine waves |
| Vertical composition | Sky 0-55%, Mtns 30-75%, Water 75-100% | Sky 0-48%, Mtns 48-100% |
| Intra-layer color | Gradient: hazy ridge to dark base | Flat solid |
| Near layer color | Deep purple/indigo | Near-black |
| Peak frequency | 2-4 per screen on near layers | ~0.3 per screen |
| Loop visibility | Not perceptible | Obvious every ~20s |

---

## 2. Files Changed

| File | Change |
|------|--------|
| `lib/drift/types.ts` | Add fields, add interface, modify DriftConfig |
| `lib/drift/terrainCurve.ts` | Configurable ridge exponent, simplified sigs, computeRidgelineY |
| `lib/drift/driftConfig.ts` | Rewrite all 5 layers |
| `lib/drift/dayNightCycle.ts` | Adjust silhouettes, add getTerrainGradient |
| `lib/drift/index.ts` | Export new types/functions |
| `components/drift/DriftScene/TerrainLayers.tsx` | LinearGradient per path, per-layer loop |
| `hooks/useDrift.ts` | scrollX raw linear, remove terrainLoopWidth |

**NOT changed:** DriftScene.tsx, component types.ts, SkyGradient, StarField, CelestialDisc, PlayerSprite, app/drift.tsx, worklets.ts.

---

## 3. types.ts Changes

### Add to TerrainLayerConfig

- `ridgeExponent: number` — Peak sharpness. `pow(x, exp)` where x in [0,1]: exp>1 narrows peaks, exp<1 broadens. Near: 1.8-2.5. Far: 1.0-1.2.
- `loopWidth: number` — Per-layer loop width px. Different per layer kills synchronized repetition.
- `pointCount: number` — Per-layer. ~loopWidth/3.3 for segment density.

### New interface

```
TerrainGradientColors { ridge: string; base: string }
```

### Remove from DriftConfig

`terrainLoopWidth` and `terrainPointCount` (now per-layer).

---

## 4. terrainCurve.ts Changes

### 4.1 Configurable ridge exponent

Current:
```typescript
const shaped = ridge * ridge;  // hardcoded exp=2
```

Proposed:
```typescript
const shaped = Math.pow(ridge, layer.ridgeExponent);
```

Math verification for exp=2.3: `pow(0.9, 2.3)=0.79`, `pow(0.5, 2.3)=0.20`, `pow(0.2, 2.3)=0.03`. Sharp peaks survive, valleys crushed to near-zero.

### 4.2 Simplified signatures

`generateTerrainPath(canvasHeight, layer)` — reads loopWidth/pointCount from layer.
`getTerrainHeight(x, layer, canvasHeight)` — reads loopWidth from layer.
`getHarmonicHeight(x, layer)` — reads loopWidth from layer.

### 4.3 New: computeRidgelineY

```typescript
export function computeRidgelineY(layer: TerrainLayerConfig, canvasHeight: number): number
```

Sums absolute amplitudes for max upward displacement. Returns `canvasHeight * baseHeight - maxUpward`. Used by TerrainLayers for gradient start position.

---

## 5. driftConfig.ts Changes

Complete rewrite of all 5 layers.

### 5.1 Vertical composition

Target: terrain 35%-72%, leaving bottom 28% for water.

| Layer | baseHeight | 900px position |
|-------|-----------|---------------|
| FAR | 0.38 | 342px |
| MID_FAR | 0.45 | 405px |
| MID | 0.52 | 468px |
| MID_NEAR | 0.60 | 540px |
| NEAR | 0.68 | 612px |

### 5.2 Amplitudes

| Layer | Dominant amp | Total budget | Range on 900px |
|-------|-------------|-------------|---------------|
| FAR | 10px | ~20px | 322-362px |
| MID_FAR | 18px | ~35px | 370-440px |
| MID | 28px | ~55px | 413-523px |
| MID_NEAR | 38px | ~70px | 470-610px |
| NEAR | 45px | ~85px | 527-697px |

### 5.3 Dominant harmonics

Remove k=1 as dominant for near layers:

| Layer | Dominant k | Peaks/loop |
|-------|-----------|-----------|
| FAR | k=1 | 1 |
| MID_FAR | k=2 | 2 |
| MID | k=2 | 2 |
| MID_NEAR | k=3 | 3 |
| NEAR | k=3 | 3 |

### 5.4 Ridge shaping

| Layer | ridgeBlend | ridgeExponent | Character |
|-------|-----------|--------------|-----------|
| FAR | 0.55 | 1.0 | Soft rounded |
| MID_FAR | 0.65 | 1.2 | Slightly sharper |
| MID | 0.72 | 1.5 | Moderate peaks |
| MID_NEAR | 0.80 | 1.9 | Sharp, wide valleys |
| NEAR | 0.85 | 2.3 | Sharpest, flattest valleys |

### 5.5 Per-layer loop widths (coprime, no common factors)

| Layer | loopWidth | pointCount | Raw repeat @60px/s | Effective (w/ parallax) |
|-------|----------|-----------|-------------------|------------------------|
| FAR | 2800 | 840 | 46.7s | 583s (px 0.08) |
| MID_FAR | 3400 | 1020 | 56.7s | 283s (px 0.20) |
| MID | 4200 | 1260 | 70.0s | 175s (px 0.40) |
| MID_NEAR | 5100 | 1530 | 85.0s | 131s (px 0.65) |
| NEAR | 6400 | 1920 | 106.7s | 107s (px 1.0) |

Combined scene never repeats within 3-min session.

### 5.6 Parallax and depth

| Layer | parallaxFactor | depthFactor |
|-------|---------------|-------------|
| FAR | 0.08 | 0.05 |
| MID_FAR | 0.20 | 0.22 |
| MID | 0.40 | 0.42 |
| MID_NEAR | 0.65 | 0.65 |
| NEAR | 1.0 | 0.88 |

NEAR depthFactor is 0.88 not 1.0 — prevents near-black, keeps deep purple/indigo.

### 5.7 Warp

| Layer | amp | k | phase |
|-------|-----|---|-------|
| FAR | 4 | 2 | 0.0 |
| MID_FAR | 8 | 3 | 1.5 |
| MID | 14 | 2 | 3.0 |
| MID_NEAR | 20 | 3 | 4.5 |
| NEAR | 28 | 2 | 2.2 |

---

## 6. dayNightCycle.ts Changes

### 6.1 Adjusted near-silhouette colors

| Phase | Current | Proposed |
|-------|---------|----------|
| Dawn | `#1A0E08` | `#2A1510` |
| Day | `#0E1A28` | `#1A2840` |
| Dusk | `#0E0A1E` | `#1A1238` |
| Night | `#050510` | `#0A0A20` |

More saturated, reads as "deep purple mountain" not "black cutout."

### 6.2 New: getTerrainGradient

```typescript
export function getTerrainGradient(
  dayProgress: number,
  depthFactor: number,
): TerrainGradientColors
```

- `ridge`: `lerpColor(skyBottom, nearSilhouette, depthFactor * 0.5)` — ridgeline is hazier
- `base`: `lerpColor(skyBottom, nearSilhouette, min(depthFactor + 0.3, 1.0))` — base is darker

Example at dusk (sky bottom `#E8734A`):

| Layer | depth | ridge t | base t | Ridge | Base |
|-------|-------|---------|--------|-------|------|
| FAR | 0.05 | 0.025 | 0.35 | ~sky orange | muted purple-orange |
| MID | 0.42 | 0.21 | 0.72 | warm purple-orange | deep purple |
| NEAR | 0.88 | 0.44 | 1.0 | mid purple | full silhouette |

### 6.3 Keep getTerrainTint

Not removed. Will be used by water surface (Step 12).

---

## 7. TerrainLayers.tsx Changes

### 7.1 Replace flat color with LinearGradient

Current:
```tsx
<Path path={skPath} color={color} transform={transform} />
```

Proposed:
```tsx
<Path path={skPath} transform={transform}>
  <LinearGradient start={vec(0, ridgeY)} end={vec(0, height)} colors={gradientColors} />
</Path>
```

### 7.2 Per-layer loop width

`buildTerrainPaths` uses `layer.loopWidth` and `layer.pointCount`.
`TerrainCopy` computes per-layer modulo:
```typescript
const layerScroll = scrollX.value * parallax;
const mod = layerScroll % layerLoop;
const tx = -(mod < 0 ? mod + layerLoop : mod) + offset;
```
Where `offset = copyIndex * layer.loopWidth`.

### 7.3 TerrainPathData additions

Add `ridgelineY: number` (from `computeRidgelineY` at build time).

### 7.4 New imports

`LinearGradient`, `vec` from `@shopify/react-native-skia`.
`getTerrainGradient`, `computeRidgelineY` from `@/lib/drift`.

---

## 8. useDrift.ts Changes

### 8.1 scrollX becomes raw linear

Current:
```typescript
const scrollX = useDerivedValue(() => {
  const raw = (time.value * effectiveSpeed) % terrainLoopWidth;
  return raw < 0 ? raw + terrainLoopWidth : raw;
});
```

Proposed:
```typescript
const scrollX = useDerivedValue(() => time.value * effectiveSpeed);
```

Each TerrainCopy handles its own modulo per layer.loopWidth.

### 8.2 Remove terrainLoopWidth destructure

Current line `const { scrollSpeedPxPerSec, terrainLoopWidth, ... } = DRIFT_CONFIG;` — remove `terrainLoopWidth`.

### 8.3 Impact analysis

scrollX consumers: only TerrainLayers.tsx (via DriftScene.tsx passthrough). No other component reads scrollX. Safe.

At 60px/s for 3600s max: scrollX reaches 216,000. float64 handles with zero precision loss.

---

## 9. Caveats and Risks

### 9.1 Path generation cost

NEAR: 6400px loop, 1920 points, 7 harmonics. ~29K ops per layer, ~100K total. Runs once at mount in useMemo. <10ms on modern phone.

### 9.2 SVG string size

1920 points = ~38KB SVG string per layer. ~120KB total. Parsed once by Skia, then GC'd. SkPath objects are compact GPU-side.

### 9.3 LinearGradient per-frame cost

10 copies x 2 colors = 20 lerpColor calls/frame. ~200 arithmetic ops. Negligible at 60fps.

### 9.4 Two copies still sufficient

Smallest loopWidth (2800) > 2 x screenWidth (786). Two copies provide 5600px coverage.

### 9.5 computeRidgelineY approximation

Sums absolute amplitudes (worst-case). Actual ridgeline may be lower due to phase cancellation. Gradient starts slightly above peaks = more haze above ridgeline = natural look.

### 9.6 Ridge exponent math

exp=2.3: pow(0.9,2.3)=0.79, pow(0.5,2.3)=0.20, pow(0.2,2.3)=0.03. Peaks survive, valleys crushed. Correct direction confirmed.

---

## 10. Expected Visual Output

### Composition
- Top 35%: Sky gradient (unchanged)
- 35%-72%: 5 terrain layers with intra-layer gradients
- 72%-100%: Empty (future water, Step 12)

### Ridgeline character
- Far: soft rounded, 1 broad peak/screen, nearly invisible against sky
- Mid: moderate peaks, 2/screen, clear gradient ridge-to-base
- Near: sharp narrow peaks, wide flat valleys, 3/loop, deep purple base

### Color across phases
- Dawn: far=warm peach haze, near=deep warm brown base
- Day: far=light blue haze, near=deep navy base
- Dusk: far=warm orange haze, near=deep indigo base
- Night: far=dark blue (barely visible), near=very dark blue base

### Repetition
No visible repeat within 3-min session. Per-layer loop widths are coprime.

---

## 11. NOT Addressed (Future Steps)

- Water surface (Step 12)
- Paraglider silhouette (Step 13)
- Wind streaks (Step 14)
- Sun/moon polish (Step 10 deferred)
- Horizon haze overlay (potential quick win, deferred)

---

## 12. Verification

1. `npx tsc --noEmit` — zero errors
2. `npx eslint` on changed files — zero errors/warnings
3. Visual on device: 5 ridgelines, gradients, no repeat, correct composition
4. Performance: no frame drops in 3-min session
5. Edge cases: all 4 day phases, loop seam, different screen sizes
