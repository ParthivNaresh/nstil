import { Skia } from "@shopify/react-native-skia";

// Unified SkSL shader for the Drift scene.
// Renders sky, stars, sun/moon discs, god rays, parallax mountain layers,
// water with reflections, and foreground mountains — all in a single pass.
//
// Coordinate system: uv (0,0) = bottom-left, (1,1) = top-right (Y flipped from fragCoord).
//
// Render order (painter's algorithm within the fragment shader):
//   1. Sky gradient
//   2. Stars (night only)
//   3. God rays + Sun disc + Moon disc
//   4. Background mountain layers (i=0..4) — drawn over sky
//  4b. Sunset/sunrise glow — additive warm bleed through mountains near horizon
//   5. Water surface (uv.y < WATER_LINE) — drawn over background mountains
//   6. Foreground mountain layers (i=5,6) — drawn over water above SHORE_LINE
//   7. Shore fog overlay — Gaussian band centered on WATER_LINE, drawn over everything
//
// Key constants:
//   WATER_LINE — Y coordinate of the water surface
//   SHORE_LINE — below this Y, water always wins over foreground mountains
//   FG_LAYERS  — number of foreground mountain layers (drawn after water)

const DRIFT_SCENE_SKSL = `
uniform float2 uResolution;
uniform float  uTime;
uniform float  uPhase;   // 0..1 day/night cycle: 0=sunrise, 0.25=noon, 0.5=sunset, 0.75=midnight
uniform float  uScrollX; // parallax scroll offset from user gesture

const int   NUM_LAYERS  = 7;     // total mountain layers (5 background + 2 foreground)
const float WATER_LINE  = 0.30;  // Y position of water surface (30% from bottom)
const float SHORE_LINE  = 0.24;  // below this, water always draws over foreground mountains
const float SUN_RADIUS  = 0.048; // sun disc radius in UV space
const float PI          = 3.14159265;

// --- Noise primitives ---

// 1D hash: deterministic pseudo-random from float
float hash(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}

// 2D hash: deterministic pseudo-random from float2
float hash2(float2 p) {
  float3 p3 = fract(float3(p.x, p.y, p.x) * float3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, float3(p3.y, p3.z, p3.x) + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// 1D value noise with quintic interpolation (C2 continuous)
float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic Hermite
  return mix(hash(i), hash(i + 1.0), u);
}

// --- Mountain terrain ---

// Rounded-but-sharp peak (derivative = 0 at summit => not needle-point).
// shapeExp lower => pointier sides, higher => rounder.
// shapeK higher => narrower peak for same width.
float rpeak(float x, float cx, float h, float w, float shapeExp, float shapeK) {
  float d = abs(x - cx) / w;
  return h * exp(-pow(d, shapeExp) * shapeK);
}

// Wrapped rpeak — tiles seamlessly when x = fract(x)
float wrpeak(float x, float cx, float h, float w, float shapeExp, float shapeK) {
  float a = rpeak(x, cx, h, w, shapeExp, shapeK);
  a = max(a, rpeak(x, cx - 1.0, h, w, shapeExp, shapeK));
  a = max(a, rpeak(x, cx + 1.0, h, w, shapeExp, shapeK));
  return a;
}

// Gaussian bump for low base envelope
float fbump(float x, float cx, float h, float w) {
  float d = (x - cx) / w;
  return h * exp(-d * d);
}

// Wrapped bump — tiles seamlessly
float wfbump(float x, float cx, float h, float w) {
  return fbump(x, cx, h, w) + fbump(x, cx - 1.0, h, w) + fbump(x, cx + 1.0, h, w);
}

// Mountain silhouette generator — produces a unique peak profile per layer.
// Uses seed to deterministically offset the 10 canonical peak positions so
// each layer has a distinct silhouette while sharing the same rpeak kernel.
// amp scales the overall height; sE/sK control peak shape.
float mtnSil(float x, float seed, float amp, float sE, float sK) {
  float base = 0.0;
  base += 0.010 * amp * wfbump(x, fract(0.50 + seed * 0.13), 1.0, 0.90);

  float p = 0.0;
  p = max(p, wrpeak(x, fract(0.06 + seed), 0.020 * amp, 0.65, sE, sK));
  p = max(p, wrpeak(x, fract(0.12 + seed), 0.032 * amp, 0.55, sE, sK));
  p = max(p, wrpeak(x, fract(0.20 + seed), 0.090 * amp, 0.50, sE, sK));
  p = max(p, wrpeak(x, fract(0.31 + seed), 0.050 * amp, 0.55, sE, sK));
  p = max(p, wrpeak(x, fract(0.40 + seed), 0.045 * amp, 0.60, sE, sK));
  p = max(p, wrpeak(x, fract(0.50 + seed), 0.095 * amp, 0.50, sE, sK));
  p = max(p, wrpeak(x, fract(0.58 + seed), 0.040 * amp, 0.55, sE, sK));
  p = max(p, wrpeak(x, fract(0.64 + seed), 0.072 * amp, 0.58, sE, sK));
  p = max(p, wrpeak(x, fract(0.76 + seed), 0.050 * amp, 0.55, sE, sK));
  p = max(p, wrpeak(x, fract(0.86 + seed), 0.030 * amp, 0.62, sE, sK));

  float h = max(base, p);

  float n = vnoise(x * (18.0 + seed * 5.0) + seed * 100.0) - 0.5;
  h += n * 0.0010;

  return max(h, 0.0);
}

float mtnH(float x, int i, float aspect) {
  float fi = float(i);

  float speed = (0.03 + fi * 0.06) * uScrollX;
  float sx = fract(x + speed / aspect);

  float seed = hash(fi * 17.3 + 4.2) * 0.8;

  float sE = 1.35 + fi * 0.05;
  float sK = 3.4 - fi * 0.15;

  float amp = 1.4 - fi * 0.15;

  float baseY;
  if (i < NUM_LAYERS - 1) {
    baseY = 0.40 - fi * 0.025;
  } else {
    baseY = 0.38 - fi * 0.025;
  }

  return baseY + mtnSil(sx, seed, amp, sE, sK);
}

// Maximum terrain height across all layers at position x (for sun occlusion)
float maxMtnH(float x, float aspect) {
  float maxH = 0.0;
  for (int i = 0; i < NUM_LAYERS; i++) {
    maxH = max(maxH, mtnH(x, i, aspect));
  }
  return maxH;
}

// --- Sun visibility ---

// Samples terrain at 5 points across the sun disc width to determine
// what fraction of the sun is visible above the ridgeline.
// Returns 0.0 (fully occluded) to 1.0 (fully visible).
float calcSunVis(float2 sp, float aspect) {
  float vis = 0.0;
  float sampleW = SUN_RADIUS * 2.0 / aspect;
  for (int s = 0; s < 5; s++) {
    float offset = (float(s) / 4.0 - 0.5) * sampleW;
    float ridgeH = maxMtnH(sp.x + offset, aspect);
    float clearance = sp.y - ridgeH;
    vis += smoothstep(-SUN_RADIUS, SUN_RADIUS * 1.5, clearance);
  }
  return vis / 5.0;
}

// --- Sky ---

// Three-band sky gradient (horizon → mid → zenith) that transitions
// between night and day palettes based on timeOfDay.
// Adds a vertical sun glow band near the sun's Y position.
float3 skyCol(float y, float timeOfDay, float2 sp) {
  float3 zenith  = mix(float3(0.03, 0.03, 0.20), float3(0.10, 0.22, 0.60), timeOfDay);
  float3 mid     = mix(float3(0.22, 0.08, 0.42), float3(0.50, 0.25, 0.68), timeOfDay);
  float3 horizon = mix(float3(0.55, 0.18, 0.30), float3(1.00, 0.62, 0.38), timeOfDay);
  float h1 = smoothstep(0.0, 0.50, y);
  float h2 = smoothstep(0.50, 1.0, y);
  float3 col = mix(mix(horizon, mid, h1), zenith, h2);

  // Horizontal glow band at sun's elevation
  float3 sunTint = mix(float3(1.0, 0.40, 0.12), float3(1.0, 0.95, 0.75), timeOfDay);
  float glowY = abs(y - sp.y);
  col += sunTint * 0.18 * exp(-glowY * glowY * 12.0) * max(timeOfDay, 0.15);
  return col;
}

// --- Celestial bodies ---

const float MOON_RADIUS = 0.045;

// Sun disc: three concentric Gaussian layers (core, inner glow, outer haze)
// plus atmospheric scatter. Colors shift warm→white with timeOfDay.
float3 sunDisc(float2 uv, float2 sp, float3 sc, float aspect, float timeOfDay) {
  float2 delta = uv - sp;
  delta.x *= aspect; // correct for non-square pixels
  float d = length(delta);

  float horizonSpread = mix(1.6, 1.0, timeOfDay); // sun appears wider near horizon
  float r = SUN_RADIUS * horizonSpread;

  float3 coreCol = mix(float3(1.0, 0.85, 0.55), float3(1.0, 0.99, 0.96), timeOfDay);
  float core = exp(-d * d / (r * r * 0.35));

  float3 innerCol = mix(float3(1.0, 0.62, 0.22), float3(1.0, 0.95, 0.85), timeOfDay);
  float inner = exp(-d * d / (r * r * 2.5)) * 0.55;

  float3 outerCol = mix(float3(0.95, 0.40, 0.12), float3(0.95, 0.85, 0.65), timeOfDay);
  float hazeR = r * mix(4.0, 2.0, timeOfDay);
  float outer = exp(-d * d / (hazeR * hazeR)) * mix(0.30, 0.12, timeOfDay);

  float scatter = exp(-d / mix(0.25, 0.10, timeOfDay)) * mix(0.08, 0.02, timeOfDay);

  return coreCol * core + innerCol * inner + outerCol * outer + sc * scatter;
}

// 2D value noise for moon surface detail (maria/craters)
float vnoise2(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash2(i);
  float b = hash2(i + float2(1.0, 0.0));
  float c = hash2(i + float2(0.0, 1.0));
  float dd = hash2(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, dd, u.x), u.y);
}

float moonFbm(float2 p) {
  float v = 0.0;
  float amp = 0.5;
  float2 shift = float2(100.0, 100.0);
  for (int i = 0; i < 4; i++) {
    v += amp * vnoise2(p);
    p = p * 2.0 + shift;
    amp *= 0.5;
  }
  return v;
}

// Moon disc: hard-edged opaque sphere with surface maria, limb darkening, and outer glow.
// Returns float4: rgb = color, a = opacity (1 inside disc, 0 outside, glow is additive-only).
float4 moonDisc(float2 uv, float2 mp, float aspect) {
  float2 delta = uv - mp;
  delta.x *= aspect;
  float d = length(delta);

  float r = MOON_RADIUS;
  float3 result = float3(0.0);
  float alpha = 0.0;

  float disc = 1.0 - smoothstep(r * 0.94, r, d);

  if (disc > 0.001) {
    float2 surfUV = delta / r;
    float z = sqrt(max(1.0 - dot(surfUV, surfUV), 0.0));

    float3 highlandCol = float3(0.92, 0.91, 0.90);
    float3 mariaCol = float3(0.52, 0.53, 0.56);

    float maria = moonFbm(surfUV * 3.5 + float2(7.3, 2.1));
    maria += moonFbm(surfUV * 7.0 + float2(13.7, 5.3)) * 0.4;
    float mariaMask = 1.0 - smoothstep(0.38, 0.58, maria);

    float3 surfCol = mix(highlandCol, mariaCol, mariaMask * 0.65);

    float limb = pow(z, 0.7);
    surfCol *= (0.75 + 0.25 * limb);

    float highlight = smoothstep(0.0, 0.6, surfUV.x * 0.25 + surfUV.y * 0.45 + 0.25);
    surfCol += float3(0.04, 0.04, 0.03) * highlight * z;

    result = surfCol;
    alpha = disc;
  }

  float glowR = r * 3.5;
  float glow = exp(-d * d / (glowR * glowR)) * 0.18;
  result += float3(0.35, 0.40, 0.55) * glow * (1.0 - alpha);

  float hazeR = r * 1.6;
  float haze = exp(-d * d / (hazeR * hazeR)) * 0.12;
  result += float3(0.60, 0.65, 0.80) * haze * (1.0 - alpha);

  return float4(result, alpha);
}

// --- God rays ---

// 12 radial shafts emanating downward from the sun position.
// Each shaft has randomized angle/width and slow time-based wobble.
// Masked to only appear below the sun (downMask).
float godRays(float2 uv, float2 sp, float vis, float aspect) {
  if (vis < 0.01) { return 0.0; }
  float2 delta = uv - sp;
  delta.x *= aspect;
  float angle = atan(delta.x, delta.y);
  float dist = length(delta);
  float rays = 0.0;
  for (int r = 0; r < 12; r++) {
    float rf = float(r);
    float rAng = (rf / 11.0 - 0.5) * 3.0;
    float width = 0.05 + 0.03 * hash(rf * 7.1);
    rAng += sin(uTime * 0.05 + rf * 1.8) * 0.012; // slow wobble
    float ad = abs(angle - rAng);
    ad = min(ad, 6.28318 - ad); // wrap around
    float shaft = smoothstep(width, 0.0, ad);
    float fall = exp(-dist * 1.4) * smoothstep(2.0, 0.1, dist);
    float bright = (r / 2 * 2 == r) ? 1.0 : 0.35; // alternating brightness
    rays += shaft * fall * bright;
  }
  float downMask = smoothstep(-0.05, 0.20, delta.y); // only below sun
  return rays * 0.035 * vis * (1.0 - downMask);
}

// --- Water ---

// Multi-frequency sine ripple pattern for water surface distortion
float waterRipple(float y, float t) {
  return sin(y * 60.0 + t * 1.2) * 0.4
       + sin(y * 130.0 - t * 0.9) * 0.25
       + sin(y * 210.0 + t * 1.7) * 0.15
       + sin(y * 35.0 - t * 0.5) * 0.2;
}

// Shore mist color: the shared intermediate tone that both water and
// foreground mountains fade toward at the waterline boundary.
// Bright, desaturated haze — lighter than the mountains so it reads as fog.
float3 shoreMistCol(float timeOfDay, float3 horCol) {
  float3 nightMist = float3(0.18, 0.16, 0.32);
  float3 dayMist = mix(horCol * 0.7, float3(0.55, 0.42, 0.62), 0.5);
  return mix(nightMist, dayMist, timeOfDay);
}

// Full water surface color including:
//   - Sky reflection (sampled from sky gradient)
//   - Mountain reflection near shore
//   - Depth-based absorption and deep tint
//   - Ripple highlights
//   - Sun reflection (elliptical glow that tracks sun position)
//   - Moon reflection (core + trail, with ripple modulation)
//   - Waterline edge highlight
float3 waterCol(float2 uv, float2 sp, float3 sc, float3 hc, float t, float gSunVis, float aspect, float moonFade, float2 moonPos, float3 shoreCol) {
  float depth = (WATER_LINE - uv.y) / WATER_LINE; // 0 at surface, 1 at bottom

  // Sky reflection: sample sky at mirrored Y
  float skySampleY = 0.35 + depth * 0.30;
  float3 skyReflected = skyCol(skySampleY, t, sp);

  // Mountain reflection near the waterline
  float mtnBand = smoothstep(0.15, 0.0, depth);
  float3 reflected = mix(skyReflected, shoreCol, mtnBand * 0.6);

  // Depth absorption: deeper water → darker, more tinted
  float3 deepTint = mix(float3(0.02, 0.01, 0.08), float3(0.03, 0.04, 0.14), t);
  float absorption = mix(0.40, 0.60, t);
  float3 col = mix(reflected * absorption, deepTint, depth * depth * 0.5);

  // Surface ripples
  float rip = waterRipple(uv.y, uTime);
  float ripStr = (1.0 - depth * 0.6) * 0.03;
  col += rip * ripStr;

  // Sun reflection: Gaussian ellipse that follows sun X and mirrors sun elevation
  float sunElev = max(sp.y - WATER_LINE, 0.0);
  float sunRefY = WATER_LINE - sunElev; // reflected Y position
  float sunRefDepth = (sunRefY - uv.y) / WATER_LINE;
  float sunDy = (uv.y - sunRefY) / max(sunElev * 1.5 + 0.02, 0.02);
  float sunVertical = exp(-sunDy * sunDy * 0.5);

  float dx = (uv.x - sp.x) * aspect;
  float sunHorizW = 0.02 + sunElev * 0.15 + depth * 0.12; // wider when sun is higher
  float sunHoriz = exp(-dx * dx / (2.0 * sunHorizW * sunHorizW));

  float sunRef = sunVertical * sunHoriz;
  float sunRefRip = 0.7 + 0.3 * waterRipple(uv.y, uTime * 1.3);
  float sunRefFade = exp(-max(sunRefDepth, 0.0) * 1.5);
  col += sc * sunRef * sunRefRip * sunRefFade * 0.55 * gSunVis;

  // Moon reflection: bright core + wider diffuse trail
  if (moonFade > 0.01) {
    float3 moonCol = float3(0.55, 0.60, 0.75);

    float mElev = max(moonPos.y - WATER_LINE, 0.0);
    float mRefY = WATER_LINE - mElev;
    float mRefDepth = (mRefY - uv.y) / WATER_LINE;
    float mDy = (uv.y - mRefY) / max(mElev * 1.5 + 0.015, 0.015);
    float mVertical = exp(-mDy * mDy * 0.5);

    float mdx = (uv.x - moonPos.x) * aspect;

    // Tight core reflection
    float coreW = 0.015 + mElev * 0.08 + depth * 0.04;
    float core = mVertical * exp(-mdx * mdx / (2.0 * coreW * coreW));
    float coreRip = 0.75 + 0.25 * waterRipple(uv.y, uTime * 1.5);
    float coreFade = exp(-max(mRefDepth, 0.0) * 1.2);
    col += moonCol * 1.2 * core * coreRip * coreFade * moonFade;

    // Wider diffuse trail
    float trailW = 0.04 + mElev * 0.12 + depth * 0.15;
    float trail = mVertical * exp(-mdx * mdx / (2.0 * trailW * trailW));
    float trailRip = 0.5 + 0.5 * waterRipple(uv.y * 1.5, uTime * 0.8);
    float trailFade = exp(-max(mRefDepth, 0.0) * 0.8);
    col += moonCol * 0.3 * trail * trailRip * trailFade * moonFade;

    // Ambient moonlight sheen on water surface
    float sheen = (1.0 - depth * 0.7) * 0.06;
    col += moonCol * sheen * moonFade;
  }

  return col;
}

// --- Stars ---

// Two-pass cell-based star field with Gaussian point sprites.
// Pass 1: large sparse cells (55x55) for bright stars.
// Pass 2: small dense cells (95x95) for dim stars.
// Each star has randomized position jitter, size, brightness, and twinkle phase.
float stars(float2 uv, float aspect) {
  float2 suv = float2(uv.x * aspect, uv.y); // square UV for round stars
  float s = 0.0;

  // Large bright stars
  float2 cell1 = floor(suv * 55.0);
  float id1 = hash2(cell1);
  if (id1 > 0.96) {
    float jx = 0.2 + 0.6 * hash2(cell1 + 71.7);
    float jy = 0.2 + 0.6 * hash2(cell1 + 149.3);
    float sz = hash2(cell1 + 237.1);
    float2 center = (cell1 + float2(jx, jy)) / 55.0;
    float d = length((suv - center) * uResolution.y);
    float sigma = 1.2 + sz * 1.8;
    float tw = 0.6 + 0.4 * sin(uTime * (0.4 + jx * 2.0) + jy * 60.0); // twinkle
    float bright = 0.6 + 0.4 * sz;
    s += exp(-d * d / (2.0 * sigma * sigma)) * tw * bright;
  }

  // Small dim stars
  float2 cell2 = floor(suv * 95.0 + 47.3);
  float id2 = hash2(cell2 + 500.0);
  if (id2 > 0.97) {
    float jx = 0.2 + 0.6 * hash2(cell2 + 613.1);
    float jy = 0.2 + 0.6 * hash2(cell2 + 731.9);
    float sz = hash2(cell2 + 859.3);
    float2 center = (cell2 + float2(jx, jy)) / 95.0 - 47.3 / 95.0;
    float d = length((suv - center) * uResolution.y);
    float sigma = 0.8 + sz * 1.0;
    float tw = 0.55 + 0.45 * sin(uTime * (0.3 + jx * 1.8) + jy * 80.0);
    float bright = 0.3 + 0.5 * sz;
    s += exp(-d * d / (2.0 * sigma * sigma)) * tw * bright;
  }

  return min(s, 1.0);
}

// ============================================================
// Main fragment shader
// ============================================================

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uResolution;
  uv.y = 1.0 - uv.y; // flip Y: 0=bottom, 1=top
  float aspect = uResolution.x / uResolution.y;

  float phase = uPhase;

  // --- Celestial body positions ---
  // Sun and moon follow sinusoidal arcs across the sky.
  // ridgeBase: Y where the arc starts/ends (horizon level)
  // arcH: maximum height above ridgeBase at zenith

  float ridgeBase = 0.42;
  float arcH = 0.38;

  // Sun: active during phase 0..0.5 (first half of cycle)
  float sunPhase = clamp(phase * 2.0, 0.0, 1.0);
  float sunX = 0.15 + sunPhase * 0.70;
  float sunY = ridgeBase - SUN_RADIUS + arcH * sin(sunPhase * PI);
  float2 sunPos = float2(sunX, sunY);

  // Moon: active during phase 0.5..1.0 (second half of cycle)
  float moonPhase = clamp((phase - 0.5) * 2.0, 0.0, 1.0);
  float moonX = 0.15 + moonPhase * 0.70;
  float moonY = ridgeBase - MOON_RADIUS + arcH * 0.85 * sin(moonPhase * PI);
  float2 moonPos = float2(moonX, moonY);

  // Fade multipliers: smooth transitions at dawn/dusk boundaries
  float sunFade = max(1.0 - smoothstep(0.48, 0.58, phase), smoothstep(0.92, 1.0, phase));
  float moonFade = smoothstep(0.45, 0.58, phase) * (1.0 - smoothstep(0.92, 1.0, phase));

  // --- Time of day ---
  // Derived from how far the sun is above the highest ridge at its X position.
  // Powers the night↔day palette transitions throughout the shader.
  float ridgeAtSun = maxMtnH(sunX, aspect);
  float sunElev = max(sunY - ridgeAtSun, 0.0) / arcH;
  float timeOfDay = pow(clamp(sunElev, 0.0, 1.0), 0.45) * sunFade;

  // Global sun visibility (0..1) — how much of the sun disc is above ridgeline
  float gSunVis = calcSunVis(sunPos, aspect) * sunFade;

  // Star visibility: fades in at night, only above water
  float nightness = 1.0 - timeOfDay;
  float starVis = smoothstep(0.55, 0.90, nightness) * smoothstep(WATER_LINE, 0.35, uv.y);

  // --- Sun/horizon color palettes ---
  // sunCol: color of the sun disc itself (warm→white with elevation)
  // horCol: horizon tint used for haze, rim light, waterline
  float3 sunLow  = float3(0.95, 0.35, 0.08);
  float3 sunMid  = float3(1.00, 0.75, 0.30);
  float3 sunHigh = float3(1.00, 0.98, 0.92);
  float3 sunCol  = mix(sunLow, mix(sunMid, sunHigh, smoothstep(0.4, 0.9, timeOfDay)), smoothstep(0.0, 0.4, timeOfDay));
  float3 horCol = mix(float3(0.85, 0.32, 0.35), float3(1.00, 0.65, 0.35), timeOfDay);

  // --- Layer 1: Sky ---
  float3 col = skyCol(uv.y, timeOfDay, sunPos);

  // --- Layer 2: Stars ---
  col += float3(0.75, 0.82, 1.0) * stars(uv, aspect) * starVis * 0.7;

  // --- Layer 3: God rays + Sun + Moon ---
  col += sunCol * godRays(uv, sunPos, gSunVis, aspect) * sunFade;
  float sunDiscVis = calcSunVis(sunPos, aspect);
  col += sunDisc(uv, sunPos, sunCol, aspect, timeOfDay) * sunFade * sunDiscVis;
  float4 moon = moonDisc(uv, moonPos, aspect);
  float moonA = moon.w * moonFade;
  col = mix(col, moon.xyz, moonA);
  col += moon.xyz * moonFade * (1.0 - moon.w);

  // --- Layer 4: Background mountains (i=0..4) ---
  // Drawn over sky. Each layer occludes everything behind it.
  // Lighting includes sun proximity warmth, atmospheric haze, rim light,
  // and moonlight (rim + directional facing + ambient).
  const int FG_LAYERS = 2;
  float3 nearestMtnCol = col;

  for (int i = 0; i < NUM_LAYERS - FG_LAYERS; i++) {
    float h = mtnH(uv.x, i, aspect);
    if (uv.y < h) {
      float fi = float(i);
      float nL = float(NUM_LAYERS - 1);
      float layerT = fi / nL; // 0=farthest, 1=nearest

      // Base ambient: far layers lighter (atmospheric perspective), near layers darker
      float3 ambientFar  = float3(0.14, 0.08, 0.24);
      float3 ambientNear = float3(0.04, 0.02, 0.10);
      float3 ambient = mix(ambientFar, ambientNear, layerT);

      // Sky bounce light on far layers
      float3 skyBounce = mix(horCol * 0.12, float3(0.08, 0.05, 0.15), 1.0 - timeOfDay);
      ambient += skyBounce * (1.0 - layerT) * 0.3;

      float3 lit = ambient;

      // Sun lighting
      if (gSunVis > 0.01) {
        float3 litFar  = mix(float3(0.65, 0.35, 0.55), float3(0.72, 0.42, 0.58), timeOfDay);
        float3 litNear = mix(float3(0.22, 0.10, 0.32), float3(0.18, 0.08, 0.28), timeOfDay);
        float3 litBase = mix(litFar, litNear, layerT);

        // Warm wash near the sun
        float2 pixPos = float2(uv.x * aspect, h * 0.5 + uv.y * 0.5);
        float2 spAR = float2(sunPos.x * aspect, sunPos.y);
        float sunDist = length(pixPos - spAR);
        float3 warmWash = mix(float3(0.85, 0.45, 0.48), float3(0.95, 0.68, 0.48), timeOfDay);
        float sunProx = exp(-sunDist * 2.8);
        litBase = mix(litBase, warmWash, sunProx * 0.65);

        // Atmospheric haze on far layers
        float haze = (1.0 - layerT);
        haze = haze * haze * haze;
        float3 hazeCol = mix(horCol * 0.55, float3(0.68, 0.38, 0.48), 0.4);
        litBase = mix(litBase, hazeCol, haze * 0.75);

        // Rim light at ridgeline
        float rimDist = h - uv.y;
        float rim = smoothstep(0.010, 0.001, rimDist);
        litBase += warmWash * rim * 0.20 * (1.0 - layerT * 0.4);

        lit = mix(ambient, litBase, gSunVis);
      }

      // Moon lighting
      if (moonFade > 0.01) {
        float3 moonCol = float3(0.45, 0.50, 0.65);
        float3 moonAmbient = float3(0.06, 0.07, 0.14);

        // Moon proximity glow
        float2 mPixPos = float2(uv.x * aspect, h * 0.5 + uv.y * 0.5);
        float2 mAR = float2(moonPos.x * aspect, moonPos.y);
        float mDist = length(mPixPos - mAR);
        float mProx = exp(-mDist * 2.5);

        // Moon rim light at ridgeline
        float rimDist = h - uv.y;
        float moonRim = smoothstep(0.012, 0.001, rimDist);
        float3 rimLight = moonCol * moonRim * 0.35 * (1.0 - layerT * 0.3);

        // Directional moon facing: finite-difference slope estimation
        float slopeR = mtnH(uv.x + 0.002, i, aspect);
        float slopeL = mtnH(uv.x - 0.002, i, aspect);
        float slope = (slopeR - slopeL) * 250.0;
        float moonDir = sign(moonPos.x - uv.x);
        float facing = clamp(-slope * moonDir, 0.0, 1.0);
        float3 facingLight = moonCol * 0.12 * facing * (1.0 - layerT * 0.5);

        // Depth shadow (darker deeper into the mountain body)
        float vertT = smoothstep(0.0, 0.06, rimDist);
        float3 depthShadow = mix(float3(0.0), moonAmbient * 0.5, vertT);

        // Night atmospheric haze
        float nightHaze = (1.0 - layerT);
        nightHaze = nightHaze * nightHaze;
        float3 hazeCol = float3(0.08, 0.09, 0.18);

        lit += (moonAmbient * (0.3 + 0.7 * (1.0 - layerT)) + rimLight + facingLight + depthShadow + mProx * moonCol * 0.15) * moonFade;
        lit = mix(lit, hazeCol, nightHaze * 0.35 * moonFade);
      }

      // Subtle darkening deeper into the mountain body
      float vertFade = smoothstep(0.0, 0.05, h - uv.y);
      lit *= (0.88 + 0.12 * (1.0 - vertFade));

      col = lit;
      nearestMtnCol = lit;
    }
  }

  // --- Layer 4b: Sunset/sunrise glow bleeding through mountains ---
  // Additive warm glow drawn AFTER mountains so the sun appears to set
  // behind them rather than vanishing. Strongest when sun is near the
  // ridgeline, shifts yellow→orange→deep red as it sinks below.
  if (sunFade > 0.01 && uv.y > WATER_LINE) {
    float ridge = maxMtnH(sunPos.x, aspect);
    float sunDip = ridge - sunPos.y;
    float glowStr = smoothstep(SUN_RADIUS * 3.0, -SUN_RADIUS * 0.5, sunDip);
    float occludeStr = smoothstep(-SUN_RADIUS * 0.5, SUN_RADIUS * 2.5, sunDip);

    float2 delta = uv - sunPos;
    delta.x *= aspect;
    float d = length(delta);

    float horizT = clamp(sunDip / (SUN_RADIUS * 3.0), 0.0, 1.0);
    float3 glowYellow = float3(1.0, 0.85, 0.35);
    float3 glowOrange = float3(1.0, 0.45, 0.10);
    float3 glowDeep   = float3(0.85, 0.20, 0.05);
    float3 glowTint = mix(glowYellow, mix(glowOrange, glowDeep, smoothstep(0.4, 1.0, horizT)), smoothstep(0.0, 0.5, horizT));

    float hazeR = SUN_RADIUS * mix(4.0, 8.0, horizT);
    float haze = exp(-d * d / (hazeR * hazeR)) * mix(0.3, 0.5, horizT);

    float aboveHaze = haze * glowStr * sunFade * (1.0 - occludeStr);
    float behindHaze = haze * glowStr * sunFade * occludeStr * 0.45;

    col += glowTint * (aboveHaze + behindHaze);
  }

  // --- Layer 5: Water surface ---
  // Fills everything below WATER_LINE, drawn over background mountains.
  if (uv.y < WATER_LINE) {
    col = waterCol(uv, sunPos, sunCol, horCol, timeOfDay, gSunVis, aspect, moonFade, moonPos, nearestMtnCol);
  }

  // --- Layer 6: Foreground mountains (i=5,6) ---
  // Drawn AFTER water. Only visible above SHORE_LINE — below that, water wins.
  // This creates the effect of mountains emerging from the water.
  // Uses identical lighting logic as background mountains.
  for (int i = NUM_LAYERS - FG_LAYERS; i < NUM_LAYERS; i++) {
    float h = mtnH(uv.x, i, aspect);
    if (uv.y < h && uv.y >= SHORE_LINE) {
      float fi = float(i);
      float nL = float(NUM_LAYERS - 1);
      float layerT = fi / nL;

      float3 ambientFar  = float3(0.14, 0.08, 0.24);
      float3 ambientNear = float3(0.04, 0.02, 0.10);
      float3 ambient = mix(ambientFar, ambientNear, layerT);

      float3 skyBounce = mix(horCol * 0.12, float3(0.08, 0.05, 0.15), 1.0 - timeOfDay);
      ambient += skyBounce * (1.0 - layerT) * 0.3;

      float3 lit = ambient;

      if (gSunVis > 0.01) {
        float3 litFar  = mix(float3(0.65, 0.35, 0.55), float3(0.72, 0.42, 0.58), timeOfDay);
        float3 litNear = mix(float3(0.22, 0.10, 0.32), float3(0.18, 0.08, 0.28), timeOfDay);
        float3 litBase = mix(litFar, litNear, layerT);

        float2 pixPos = float2(uv.x * aspect, h * 0.5 + uv.y * 0.5);
        float2 spAR = float2(sunPos.x * aspect, sunPos.y);
        float sunDist = length(pixPos - spAR);
        float3 warmWash = mix(float3(0.85, 0.45, 0.48), float3(0.95, 0.68, 0.48), timeOfDay);
        float sunProx = exp(-sunDist * 2.8);
        litBase = mix(litBase, warmWash, sunProx * 0.65);

        float haze = (1.0 - layerT);
        haze = haze * haze * haze;
        float3 hazeCol = mix(horCol * 0.55, float3(0.68, 0.38, 0.48), 0.4);
        litBase = mix(litBase, hazeCol, haze * 0.75);

        float rimDist = h - uv.y;
        float rim = smoothstep(0.010, 0.001, rimDist);
        litBase += warmWash * rim * 0.20 * (1.0 - layerT * 0.4);

        lit = mix(ambient, litBase, gSunVis);
      }

      if (moonFade > 0.01) {
        float3 moonCol = float3(0.45, 0.50, 0.65);
        float3 moonAmbient = float3(0.06, 0.07, 0.14);

        float2 mPixPos = float2(uv.x * aspect, h * 0.5 + uv.y * 0.5);
        float2 mAR = float2(moonPos.x * aspect, moonPos.y);
        float mDist = length(mPixPos - mAR);
        float mProx = exp(-mDist * 2.5);

        float rimDist = h - uv.y;
        float moonRim = smoothstep(0.012, 0.001, rimDist);
        float3 rimLight = moonCol * moonRim * 0.35 * (1.0 - layerT * 0.3);

        float slopeR = mtnH(uv.x + 0.002, i, aspect);
        float slopeL = mtnH(uv.x - 0.002, i, aspect);
        float slope = (slopeR - slopeL) * 250.0;
        float moonDir = sign(moonPos.x - uv.x);
        float facing = clamp(-slope * moonDir, 0.0, 1.0);
        float3 facingLight = moonCol * 0.12 * facing * (1.0 - layerT * 0.5);

        float vertT = smoothstep(0.0, 0.06, rimDist);
        float3 depthShadow = mix(float3(0.0), moonAmbient * 0.5, vertT);

        float nightHaze = (1.0 - layerT);
        nightHaze = nightHaze * nightHaze;
        float3 hazeCol = float3(0.08, 0.09, 0.18);

        lit += (moonAmbient * (0.3 + 0.7 * (1.0 - layerT)) + rimLight + facingLight + depthShadow + mProx * moonCol * 0.15) * moonFade;
        lit = mix(lit, hazeCol, nightHaze * 0.35 * moonFade);
      }

      float vertFade = smoothstep(0.0, 0.05, h - uv.y);
      lit *= (0.88 + 0.12 * (1.0 - vertFade));

      col = lit;
    }
  }

  // --- Layer 7: Shore fog overlay ---
  // Single fog band drawn on top of ALL layers (mountains, water, foreground).
  // Gaussian centered on WATER_LINE so it straddles the boundary equally,
  // hiding the hard seam where mountain meets water.
  float fogDist = uv.y - SHORE_LINE;
  float fogStr = exp(-fogDist * fogDist / (2.0 * 0.025 * 0.025));
  float3 fogCol = shoreMistCol(timeOfDay, horCol);
  col = mix(col, fogCol, fogStr * 0.70);

  // --- Post-processing ---

  // Vignette: darken edges
  float2 vc = (uv - 0.5) * float2(aspect, 1.0);
  col *= 1.0 - dot(vc, vc) * 0.65;

  // Film grain: subtle dithering to break banding
  col += (hash(uv.x * 1000.0 + uv.y * 7777.0 + uTime * 3.3) - 0.5) * 0.018;

  return half4(half3(max(col, float3(0.0))), 1.0);
}
`;

export const driftSceneShader = Skia.RuntimeEffect.Make(DRIFT_SCENE_SKSL);
