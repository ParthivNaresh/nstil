import { Skia } from "@shopify/react-native-skia";

const AMBIENT_SKSL = `
uniform float2 uResolution;
uniform float uTime;
uniform float4 uColor1;
uniform float4 uColor2;
uniform float4 uColor3;

float blob(float2 uv, float2 center, float size) {
  float d = length(uv - center);
  return smoothstep(size, size * 0.15, d);
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / uResolution;

  float t = uTime * 0.04;

  float pulse1 = 0.45 + 0.1 * sin(t * 1.2);
  float pulse2 = 0.40 + 0.1 * sin(t * 0.9 + 1.5);

  float2 p1 = float2(
    0.25 + 0.2 * sin(t * 0.3),
    0.25 + 0.15 * cos(t * 0.25)
  );
  float2 p2 = float2(
    0.75 + 0.15 * cos(t * 0.2),
    0.55 + 0.2 * sin(t * 0.35)
  );

  float b1 = blob(uv, p1, pulse1);
  float b2 = blob(uv, p2, pulse2);

  half4 base = half4(uColor1);
  half4 c2 = half4(uColor2);
  half4 c3 = half4(uColor3);

  half4 color = base;
  color = mix(color, c2, half4(b1));
  color = mix(color, c3, half4(b2));

  return color;
}
`;

export const ambientShader = Skia.RuntimeEffect.Make(AMBIENT_SKSL);
