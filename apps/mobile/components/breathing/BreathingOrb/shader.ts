import { Skia } from "@shopify/react-native-skia";

const BREATHING_ORB_SKSL = `
uniform float2 uResolution;
uniform float uTime;
uniform float uRadius;
uniform float uOpacity;
uniform float4 uColorCore;
uniform float4 uColorEdge;

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uResolution;
  float2 center = float2(0.5, 0.5);
  float2 p = uv - center;

  float maxDim = max(uResolution.x, uResolution.y);
  float radiusNorm = uRadius / maxDim;

  float t = uTime * 0.06;

  float2 wobble = float2(
    sin(t * 1.7 + p.y * 6.0) * 0.008,
    cos(t * 1.3 + p.x * 6.0) * 0.008
  );
  float2 distorted = p + wobble;

  float dist = length(distorted);

  float boundary = 0.49;
  float boundaryFade = 1.0 - smoothstep(boundary * 0.85, boundary, dist);

  float edge = smoothstep(radiusNorm, radiusNorm * 0.85, dist);

  float coreFalloff = smoothstep(radiusNorm * 0.6, 0.0, dist);
  half4 color = mix(half4(uColorEdge), half4(uColorCore), half4(coreFalloff));

  float glowDist = smoothstep(radiusNorm * 1.25, radiusNorm, dist);
  half4 glow = half4(uColorEdge) * half4(glowDist * 0.12);

  half4 result = color * half4(edge) + glow;
  result *= half4(boundaryFade);
  result.a *= uOpacity;

  return result;
}
`;

export const breathingOrbShader = Skia.RuntimeEffect.Make(BREATHING_ORB_SKSL);
