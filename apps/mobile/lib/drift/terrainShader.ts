import { Skia } from "@shopify/react-native-skia";

const TERRAIN_SKSL = `
uniform float2 uResolution;
uniform float2 uSunPos;
uniform float  uSunInfluence;
uniform float  uDepth;
uniform float  uRidgeY;
uniform float  uScrollTx;
uniform float4 uSkyBottom;
uniform float4 uSilhouette;
uniform float4 uWarmTint;

half4 main(float2 fragCoord) {
  float screenX = (fragCoord.x + uScrollTx) / uResolution.x;
  float screenY = fragCoord.y / uResolution.y;

  float verticalT = clamp((screenY - uRidgeY) / (1.0 - uRidgeY), 0.0, 1.0);

  float ridgeMix = 0.08 + uDepth * 0.50;
  float baseMix = 0.20 + uDepth * 0.80;
  float depthMix = mix(ridgeMix, baseMix, verticalT);

  half4 baseColor = mix(half4(uSkyBottom), half4(uSilhouette), half4(depthMix));

  float2 pixelPos = float2(screenX, screenY);
  float sunDist = distance(pixelPos, uSunPos);
  float sunGlow = 1.0 - smoothstep(0.0, 0.7, sunDist);
  sunGlow *= sunGlow;

  float warmStrength = (1.0 - uDepth * 0.7) * uSunInfluence;
  float verticalWarmFade = 1.0 - verticalT * 0.6;

  half4 finalColor = mix(
    baseColor,
    half4(uWarmTint),
    half4(sunGlow * warmStrength * verticalWarmFade)
  );

  return finalColor;
}
`;

export const terrainShader = Skia.RuntimeEffect.Make(TERRAIN_SKSL);
