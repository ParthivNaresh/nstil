# Viewport-Space Gradient Investigation

## Goal
Move terrain gradient from per-Path local coordinates to viewport (screen) space so that:
1. No seam between tiled copies (single gradient spans entire viewport)
2. Gradient direction follows sun position in real-time
3. Each layer gets its own depth-appropriate colors but shares the same directional axis

## Current Architecture
- TerrainLayers.tsx renders 5 layers, each with 2 copies (copy 0 and copy 1)
- Each copy is a Path with a LinearGradient child
- The gradient is in the path's local coordinate space [0, loopWidth] x [ridgelineY, height]
- Each copy has its own independent gradient causing seam at tile boundary

## Key Finding: Skia Shader Coordinate Behavior

From official Skia docs (skia.org/docs/user/coordinates):
- **"Shaders do not move with geometry."**
- Shaders are evaluated in the LOCAL coordinate space of the canvas
- When canvas.translate() is applied, BOTH geometry AND shader coordinates shift
- When a shader is on a Group, and children have transforms, the shader is in the Group's space

This means: if we put a LinearGradient on a parent Group (in screen space), and the
child Paths have translateX transforms for scrolling, the gradient stays fixed in screen
space while the paths scroll underneath it. This is EXACTLY what we want.

From react-native-skia docs (shopify.github.io):
- Paint attributes (including shaders like LinearGradient) can be children of Group
- Descendants inherit paint attributes
- A LinearGradient child of a Group applies to all shapes within that Group

## Critical Nuance: Transform + Shader Interaction

The Skia docs say "Shaders do not move with geometry" — but this refers to when
geometry position changes (e.g., drawRect at x=100) WITHOUT a canvas transform.

When a canvas.translate() is applied (which is what Group/Path `transform` does),
it changes the LOCAL coordinate space. Both geometry AND shaders are evaluated in
this new space. So a shader on a translated Path DOES move with the Path.

This means: simply putting LinearGradient on a parent Group and having child Paths
with translateX transforms will NOT work as expected. The shader would be inherited
but each Path's transform would shift the shader evaluation coordinates.

### Approach: Inverse Transform on Shader

The LinearGradient component has a `transform` property. We can apply the INVERSE
of the Path's scroll transform to the shader, effectively canceling out the Path's
translation and keeping the shader in screen space.

But this is complex — each copy has a different translateX, so we'd need per-copy
shader transforms. This defeats the purpose of a shared gradient.

### Better Approach: Group with clip + no per-path transform

Instead of translating each Path, we can:
1. Wrap each layer in a Group with `clip={rect(0, 0, width, height)}` (viewport clip)
2. Put the LinearGradient on this Group (screen-space coordinates)
3. Render both path copies as children WITHOUT individual transforms
4. Instead, apply a single Group-level transform that scrolls both copies together

Wait — this still has the same problem. The Group transform shifts the shader.

### Best Approach: layer prop (offscreen bitmap)

The Group `layer` prop renders children to an offscreen bitmap first, then applies
paint effects. But this is for image filters, not for replacing the fill shader.

### Actual Solution: Clip Group + Untransformed Gradient

Structure:
```
<Group clip={rect(0, 0, width, height)}>  // viewport clip, no transform
  <LinearGradient ... />                   // screen-space gradient
  <Path path={...} transform={scrollTx0} /> // copy 0 scrolled
  <Path path={...} transform={scrollTx1} /> // copy 1 scrolled
</Group>
```

The key question: does the Path's `transform` affect the inherited shader?

In Skia's model, when a child has a transform, it creates a new local coordinate
space. The inherited paint (shader) is evaluated in the CHILD's local space, not
the parent's. So the shader WOULD shift with each Path's transform.

This is confirmed by the Skia docs: "canvas.translate() causes all local coordinates
(geometry and shaders) to be evaluated in the new space."

### The Real Solution: Shader Transform Compensation

For each Path copy, we need the gradient to appear in screen space. The Path has
transform `translateX(tx)`. The shader needs to be in screen space, so we need
the shader to have an inverse transform `translateX(-tx)`.

In react-native-skia, LinearGradient has a `transform` prop. We can set:
- Path transform: `[{ translateX: tx }]`
- LinearGradient transform: `[{ translateX: -tx }]`

This way the shader stays fixed in screen space while the geometry scrolls.

Both copies would use the SAME gradient colors and SAME screen-space start/end
points, but each would have a different shader transform to compensate for its
scroll position. The visual result: a single continuous gradient across the viewport,
with the terrain shapes scrolling through it.

## DriftScene Structure
- DriftScene.tsx creates a Canvas with width/height from layout
- TerrainLayers receives dayProgress, scrollX, width, height as props
- Each layer has 2 copies with translateX based on scrollX * parallaxFactor

## Confirmed Solution: Per-Copy Shader Transform Compensation

The LinearGradient `transform` prop allows us to apply an inverse translation to
the shader, canceling out the Path's scroll transform. This keeps the shader
evaluation in screen space while the geometry scrolls.

Structure per layer:
```tsx
<Group>
  {/* Copy 0 */}
  <Path path={skPath} transform={[{ translateX: tx0 }]}>
    <LinearGradient
      start={screenStart}
      end={screenEnd}
      colors={[lit, mid, shadow]}
      positions={[0, 0.35, 1]}
      transform={[{ translateX: -tx0 }]}  // inverse of path transform
    />
  </Path>
  {/* Copy 1 */}
  <Path path={skPath} transform={[{ translateX: tx1 }]}>
    <LinearGradient
      start={screenStart}
      end={screenEnd}
      colors={[lit, mid, shadow]}
      positions={[0, 0.35, 1]}
      transform={[{ translateX: -tx1 }]}  // inverse of path transform
    />
  </Path>
</Group>
```

Why this works:
1. Path transform shifts geometry to scroll position: `translateX(tx)`
2. This also shifts the shader coordinate space by `tx`
3. LinearGradient's own `transform` applies `translateX(-tx)` to the shader
4. Net effect: shader evaluates at original screen-space coordinates
5. Both copies sample from the same effective gradient → no seam

The gradient start/end are computed in SCREEN space:
- centerX = width / 2, centerY = (ridgelineY + height) / 2
- halfWidth = width / 2, halfHeight = (height - ridgelineY) / 2
- getGradientEndpoints(lightDir, centerX, centerY, halfWidth, halfHeight)

Note: we use viewport width (not loopWidth) for the gradient bbox since the
gradient should span the visible screen, not the tile.

## Implementation Plan

### Changes to TerrainLayers.tsx

1. Remove `centerX`, `centerY`, `halfWidth`, `halfHeight` from TerrainPathData
   (these were per-tile, now we compute per-viewport)

2. Pass `width` into TerrainCopy (needed for screen-space gradient bbox)

3. In TerrainCopy, compute a single `useDerivedValue` for the scroll translateX
   (already exists as `transform`), and extract the raw `tx` value

4. Compute gradient start/end in screen space using viewport dimensions:
   - centerX = width / 2
   - centerY = (ridgelineY + height) / 2
   - halfWidth = width / 2
   - halfHeight = (height - ridgelineY) / 2

5. Add `transform` prop to LinearGradient with inverse translateX

6. Both copies share identical gradient colors and screen-space endpoints,
   differing only in their shader transform compensation

### Changes to dayNightCycle.ts

None — getGradientEndpoints and getLightDirection work with any bbox dimensions.
We just pass viewport dimensions instead of tile dimensions.

### Performance Notes
- Each TerrainCopy still has its own LinearGradient (required for per-copy
  shader transform), but the gradient computation is shared (same colors,
  same screen-space endpoints)
- The shader transform is a single translateX — trivial GPU operation
- No additional draw calls or offscreen buffers

## Confirmed: LinearGradient transform is animatable

From react-native-skia animation docs:
"React Native Skia supports the direct usage of Reanimated's shared and derived
values as properties. There is no need for createAnimatedComponent or
useAnimatedProps; simply pass the Reanimated values directly as properties."

This means useDerivedValue can be passed to LinearGradient's `transform` prop.

## Investigation Status
- [x] Skia Group + Paint gradient behavior with translated children
- [x] Whether LinearGradient coordinates are in parent or local space
- [x] DriftScene parent structure and how TerrainLayers is mounted
- [x] Verify Group + LinearGradient + translated Path children works in RN Skia
- [x] LinearGradient transform prop is animatable via useDerivedValue
- [x] Implementation plan

## Ready for implementation
