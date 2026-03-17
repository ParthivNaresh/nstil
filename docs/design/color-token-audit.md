# Color Token Audit — What the User Can Customize

## Full ColorPalette (25 tokens)

| Token | Dark Value | Usages | What It Controls | User-Editable? |
|-------|-----------|--------|-----------------|----------------|
| **background** | `#0A0A0F` | 2 | Root layout `backgroundColor`, ReflectionCard modal bg | ✅ Yes — but only visible behind the ambient shader. Changing it affects the "base" behind the gradient. |
| **surface** | `#12121A` | 4 | Calendar bg (35% alpha), ScrollContainer progress bg, CreateTabButton gradient, CustomThemeModal bg | ✅ Yes — card containers, modal backgrounds |
| **surfaceElevated** | `#1A1A24` | 4 | Card "elevated" variant bg, JournalFilterSheet bg, Skeleton loading bg, edit button bg | Derive from surface |
| **sheet** | `#1A1A24` | 3 | LocationSearchSheet bg, DateTimePickerSheet bg, ColorPickerSheet bg | Derive from surface |
| **glass** | `rgba(255,255,255,0.05)` | 49 | Card "glass" variant bg, TextInput bg, SearchInput bg, TagInput bg, all picker items, CreateMenu, theme cards | ✅ Yes — this is the most visible "container" color in the entire app |
| **glassBorder** | `rgba(255,255,255,0.08)` | 36 | Card borders, input borders, sheet borders, filter rows, theme cards | Derive from glass |
| **glassHover** | `rgba(255,255,255,0.10)` | 0 | Unused | Skip |
| **textPrimary** | `#FFFFFF` | 36 | All primary text (headings, body, labels, entry titles) | ✅ Yes — already exposed |
| **textSecondary** | `rgba(255,255,255,0.70)` | 61 | Subtitles, descriptions, secondary labels, email display | ✅ Yes — already exposed |
| **textTertiary** | `rgba(255,255,255,0.40)` | 98 | Placeholders, timestamps, hints, captions, disabled text | Derive from textSecondary |
| **accent** | `#edb382` | 146 | Buttons, active indicators, icons, links, tab bar pill, check marks, accent strips, mood badge text, streak banner | ✅ Yes — already exposed |
| **accentLight** | `#9B82FC` | 9 | Tag pill text, accent variations | Derive from accent |
| **accentMuted** | `rgba(124,92,252,0.15)` | 8 | Selected card bg, icon containers, notification icon bg | Derive from accent |
| **onAccent** | `#FFFFFF` | 1 | Text on accent-colored buttons | Derive from accent luminance |
| **success** | `#34D399` | 4 | Success states, breathing complete | Keep fixed (semantic) |
| **successMuted** | `rgba(52,211,153,0.10)` | 0 | Unused | Skip |
| **warning** | `#FBBF24` | 1 | Warning states | Keep fixed (semantic) |
| **warningMuted** | `rgba(251,191,36,0.10)` | 0 | Unused | Skip |
| **error** | `#F87171` | 14 | Error messages, form validation, delete buttons, badges | Keep fixed (semantic) |
| **errorMuted** | `rgba(248,113,113,0.10)` | 1 | Topics-to-avoid tag bg | Keep fixed (semantic) |
| **onError** | `#FFFFFF` | 2 | Text on error backgrounds | Keep fixed (semantic) |
| **border** | `rgba(255,255,255,0.06)` | 21 | Dividers, header bottom border, tab bar top border, footer separators | Derive from glass |
| **borderFocused** | `rgba(124,92,252,0.40)` | 4 | Focused input borders | Derive from accent |

## Ambient Background (3 shader colors)

| Color | Dark Value | What It Controls |
|-------|-----------|-----------------|
| **color1** | `[0.039, 0.039, 0.059, 1.0]` | Base gradient color (matches background) |
| **color2** | `[0.20, 0.08, 0.40, 1.0]` | Primary gradient accent (purple glow) |
| **color3** | `[0.05, 0.18, 0.35, 1.0]` | Secondary gradient accent (blue glow) |

These drive the animated Skia shader that covers the entire screen. Currently auto-derived from accent in `themeBuilder.ts`.

---

## Recommended User-Editable Colors

### Tier 1 — High Impact (expose to user)

| Field | Token(s) Affected | Visual Impact | Why |
|-------|-------------------|---------------|-----|
| **Accent** | `accent`, `accentLight`, `accentMuted`, `onAccent`, `borderFocused` | Buttons, icons, active states, links, tab indicator | 146 usages — the single most impactful color |
| **Text Primary** | `textPrimary` | All headings and body text | 36 usages — readability |
| **Text Secondary** | `textSecondary`, `textTertiary` | Subtitles, captions, placeholders | 159 combined usages — the most used text colors |
| **Surface** | `surface`, `surfaceElevated`, `sheet` | Card backgrounds, modal backgrounds, calendar, skeleton loading | 14 combined usages — the "container" color behind content |
| **Glass** | `glass`, `glassBorder`, `border` | Card fills, input fills, all borders, dividers | 106 combined usages — the most visible structural color |

### Tier 2 — Medium Impact (could expose)

| Field | Token(s) Affected | Visual Impact | Why |
|-------|-------------------|---------------|-----|
| **Background** | `background` | Root layout behind the shader | Only 2 direct usages, but it's the base layer. Visible when shader is transparent or during transitions. |
| **Ambient Color 2** | Shader `color2` | The primary gradient glow color | Currently auto-derived from accent. Exposing it lets users control the gradient independently of the accent. |
| **Ambient Color 3** | Shader `color3` | The secondary gradient glow color | Same as above — independent gradient control. |

### Tier 3 — Keep Fixed (semantic, don't expose)

| Token | Why |
|-------|-----|
| `success` | Green = success is universal. Changing it breaks semantic meaning. |
| `warning` | Yellow = warning is universal. |
| `error` | Red = error/danger is universal. |
| `onAccent`, `onError` | Auto-derived for contrast. |
| `glassHover`, `successMuted`, `warningMuted` | Unused or near-zero usage. |

---

## Current State vs. Recommended

| Currently Exposed | Recommended Addition | Impact |
|-------------------|---------------------|--------|
| textPrimary ✅ | — | — |
| textSecondary ✅ | — | — |
| accent ✅ | — | — |
| — | **surface** | Cards, modals, calendar — the "container" color |
| — | **glass** | Card fills, input fills — the most visible structural element |
| — | **background** | Root layer behind shader |

**Adding `surface` and `glass` would give the user control over 90%+ of the visible UI.** The remaining tokens are either auto-derived or semantic (error/success/warning).

The ambient shader colors (color1/color2/color3) are currently auto-derived from background + accent. Exposing them separately would give full gradient control, but adds complexity. Recommendation: keep auto-derived for now, expose as "Advanced" option later.
