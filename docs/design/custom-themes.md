# Custom Themes — Implementation Plan

## Overview

Transform the inline Theme picker in Settings into a full Theme page with preset themes, and up to 3 user-created custom themes with a modal-based color editor. The feature is split into phases, each independently shippable.

---

## Decisions

| Question | Decision |
|----------|----------|
| Color picker library | `reanimated-color-picker` (installed) |
| Color selection UX | Gradient panel (hue wheel + saturation/brightness) with confirm button |
| Exposed color count | 3 (textPrimary, textSecondary, accent) — background/surface locked to dark palette |
| Max custom themes | 3 per user |
| Custom theme UI | Modal (like LocationSearchSheet), not inline expand or separate screen |
| Preset themes | 4 curated (Sunset, Forest, Ocean, Rosé) alongside Dark/Light/OLED/Auto |
| Theme page navigation | Chevron on Theme card in Settings → dedicated Theme screen |
| Persistence | SecureStore locally (Phase B), server-side in Phase C |

---

## Phase A — Theme Page & Preset Themes ✅

Completed. Settings → Theme card → Theme page with Standard (4) + Presets (4) sections.

---

## Phase B — Custom Theme Editor (Revised)

### Data Model

**Current (single custom theme):**
```typescript
customInput: CustomThemeInput        // { textPrimary, textSecondary, accent }
customBuilt: BuiltCustomTheme | null // derived palette + ambient
ThemeMode includes "custom"
```

**New (up to 3 custom themes):**
```typescript
interface SavedCustomTheme {
  readonly id: string;               // uuid or "custom_0" / "custom_1" / "custom_2"
  readonly name: string;             // user-visible label, e.g. "My Theme 1"
  readonly input: CustomThemeInput;  // { textPrimary, textSecondary, accent }
  readonly built: BuiltCustomTheme;  // derived palette + ambient
}

// Store state
customThemes: readonly SavedCustomTheme[];  // max 3
activeCustomId: string | null;              // which custom theme is active (when mode === "custom")
```

**`ThemeMode` stays as `"custom"`** — when mode is `"custom"`, the store looks up `activeCustomId` in `customThemes` to resolve the palette. This avoids polluting the `ThemeMode` union with dynamic IDs.

**SecureStore persistence:**
- `nstil_custom_themes` — JSON array of `{ id, name, input }` (max 3 items)
- `nstil_active_custom_id` — string ID of the active custom theme
- Remove `nstil_custom_theme_input` (old single-theme key)

### Custom Section UX

The "Custom" section on the Theme page shows:

```
Custom
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  + New   │ │ Theme 1 │ │ Theme 2 │ │         │
│          │ │  ✓      │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

- **First card is always "+" (New Theme)** — fixed position, always visible
- **Saved custom themes** appear as cards to the right (same visual style as Standard/Preset cards, showing the 3 preview colors from the custom input)
- **Active custom theme** has a check indicator (same as Standard/Preset cards)
- **Tapping a saved custom theme** applies it immediately (same as tapping a preset)
- **Long-press a saved custom theme** shows delete option
- **Max 3 saved** — when 3 exist, the "+" card is hidden or disabled

### "New Theme" Flow

1. User taps "+" card
2. **Modal opens** (full-screen `Modal` with `presentationStyle="pageSheet"`, same pattern as `LocationSearchSheet` and `ReflectionCard`)
3. Modal shows:
   - Header: "New Custom Theme" with X close button
   - 3 color rows (Primary Text, Secondary Text, Accent) — pre-filled with the **currently active theme's** resolved colors
   - Each row: label + color swatch + hex value. Tap opens the color picker
   - Color picker: `reanimated-color-picker` panel with a **"Done" button** (check mark) to confirm the selection
   - "Save Theme" button at the bottom
4. While editing, the app shows a **live preview** — the modal is translucent enough to see the ambient background change, or the modal itself uses the draft colors for its own styling
5. Tapping "Save Theme" → saves to `customThemes` array, sets mode to `"custom"`, sets `activeCustomId` to the new theme's ID, closes modal
6. Tapping X → discards draft, closes modal, reverts to previous theme

### Color Picker Confirmation

The `ColorPickerSheet` currently auto-applies on `onCompleteJS`. Change to:

1. User taps a color row → bottom sheet slides up with the picker
2. User drags on the gradient panel — **preview updates live** (the draft color changes in real-time)
3. User taps a **"Done" check mark button** at the top-right of the sheet → confirms the color, closes the sheet
4. User taps backdrop → **cancels**, reverts to the previous color for that field

This requires the `ColorPickerSheet` to manage a draft color internally and only commit on confirm.

### Store Changes

| Current | New |
|---------|-----|
| `customInput: CustomThemeInput` | `customThemes: SavedCustomTheme[]` (max 3) |
| `customBuilt: BuiltCustomTheme \| null` | `activeCustomId: string \| null` |
| `setCustomTheme(input)` | `saveCustomTheme(name, input)` — adds/updates a theme in the array |
| — | `deleteCustomTheme(id)` — removes from array |
| — | `activateCustomTheme(id)` — sets mode to "custom" + activeCustomId |
| `resolvePalette("custom", customBuilt)` | `resolvePalette("custom", ...)` looks up `activeCustomId` in `customThemes` |

### Component Changes

| Component | Change |
|-----------|--------|
| `ThemePage` | Remove inline expand/collapse. Custom section renders a horizontal row of cards: "+" card + saved theme cards. Tapping "+" opens modal. |
| `CustomThemeEditor` | Move into a `Modal` wrapper. Receives draft input as state, calls `onSave(input)` on confirm. |
| `ColorPickerSheet` | Add "Done" confirm button (check mark icon). Manage internal draft color. Backdrop dismiss = cancel. |
| `ColorRow` | No change — still shows label + swatch + hex. |
| `ColorSection` | No change. |

### New Components

| Component | Purpose |
|-----------|---------|
| `CustomThemeModal` | Full-screen `Modal` wrapping `CustomThemeEditor` + header + save button. Manages draft state. Pre-fills from current theme's resolved colors. |
| `CustomThemeCard` | Card for a saved custom theme in the grid. Shows preview colors, name, check indicator. Tap to activate, long-press to delete. |
| `NewThemeCard` | The "+" card. Fixed first position. Tap opens `CustomThemeModal`. |

### Pre-fill Logic

When the user taps "+", the modal pre-fills the 3 color fields from the **currently active theme's resolved palette**:

```typescript
function getPreFillInput(colors: ColorPalette): CustomThemeInput {
  return {
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    accent: colors.accent,
  };
}
```

This works for any theme — Dark, Light, OLED, presets, or an existing custom theme. The user sees the current colors and can tweak from there.

**Edge case:** `textSecondary` in the existing palettes uses `rgba()` format (e.g., `"rgba(255, 255, 255, 0.70)"`), but the color picker works with hex. The pre-fill function needs to convert rgba to hex. Add a `rgbaToHex()` utility to `colorUtils.ts`.

### i18n Keys

```typescript
settings.customTheme.newTheme: "New Custom Theme"
settings.customTheme.saveTheme: "Save Theme"
settings.customTheme.deleteTitle: "Delete Theme?"
settings.customTheme.deleteMessage: "This custom theme will be removed."
settings.customTheme.deleteConfirm: "Delete"
settings.customTheme.deleteCancel: "Cancel"
settings.customTheme.maxReached: "Maximum 3 custom themes"
settings.customTheme.colorDone: "Done"
```

### Execution Steps

| Step | Description | Status |
|------|-------------|--------|
| B1 | Update `themeStore` — replace single custom with `SavedCustomTheme[]` (max 3), `activeCustomId`, `saveCustomTheme()`, `deleteCustomTheme()`, `activateCustomTheme()`. Updated persistence to `nstil_custom_themes` + `nstil_active_custom_id`. Updated `useTheme` hook. Updated `AmbientBackground` to read active custom ambient. | ✅ |
| B2 | Add `rgbaToHex()` to `colorUtils.ts` for pre-fill conversion | ✅ |
| B3 | Update `ColorPickerSheet` — converted to centered floating card modal matching `LocationSearchSheet` pattern (`Modal transparent animationType="none"`, centered overlay, `CARD_WIDTH` max 340px, `borderRadius["2xl"]`, `FadeIn`/`FadeOut`). Check/X confirm/cancel in header. Internal `draftColor` state. Props changed to `onConfirm`/`onCancel`. `CustomThemeEditor` updated to match. | ✅ |
| B4 | Create `CustomThemeCard` — saved theme card matching `ThemeModeCard` visual style, preview colors from custom input, check indicator when active, tap to activate with haptic, long-press to delete with Alert confirmation. | ✅ |
| B5 | Create `NewThemeCard` — "+" card with dashed border, Plus icon, disabled at opacity 0.4 when 3 themes exist. | ✅ |
| B6 | Create `CustomThemeModal` — `Modal` with `presentationStyle="pageSheet"`, X close + title header, `CustomThemeEditor` in `ScrollView`, "Save Theme" footer button. Pre-fills from current palette via `getPreFillInput()` + `rgbaToHex()`. Draft state resets on open. | ✅ |
| B7 | Update `ThemePage` — Custom section renders `NewThemeCard` + `CustomThemeCard` cards. "+" opens modal, save auto-names and commits to store, activate/delete wired to store actions. | ✅ |
| B8 | Update `freshInstall.ts` — new SecureStore keys | ✅ |
| B9 | i18n keys — added `newTheme`, `newLabel`, `saveTheme`, `deleteTitle`, `deleteMessage`, `deleteConfirm`, `deleteCancel`, `maxReached`, `textSection`, `accentSection`, `primary`, `secondary`, `accent`, `subtitle` under `settings.customTheme`. Added `custom` to `settings.themeSections`. | ✅ |

---

## Phase C — Backend Persistence & Sync

### Database Migration

```sql
ALTER TABLE public.profiles
    ADD COLUMN theme_mode text NOT NULL DEFAULT 'dark'
        CONSTRAINT profiles_theme_mode_check
        CHECK (theme_mode IN ('dark','light','oled','auto','custom','sunset','forest','ocean','rose')),
    ADD COLUMN custom_themes jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN active_custom_theme_id text;
```

`custom_themes` stores the array of `{ id, name, input }` objects (max 3). `active_custom_theme_id` stores which custom theme is active when `theme_mode = 'custom'`.

### Backend Changes

- `ProfileRow`, `ProfileUpdate`, `ProfileResponse` — add `theme_mode`, `custom_themes`, `active_custom_theme_id`
- Validation: `custom_themes` array max length 3, each item validated against `CustomThemeInput` schema
- Existing `PATCH /api/v1/profile` handles the new fields

### Mobile Sync

- On profile fetch: if server `theme_mode` differs from local, apply server's theme
- On theme change: update store → persist to SecureStore → fire `PATCH /api/v1/profile`

---

## Phase D — Custom Image Backgrounds

(Unchanged from previous plan — deferred)

---

## Phase E — Animated Video Backgrounds

(Unchanged from previous plan — deferred)
