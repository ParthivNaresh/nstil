# Custom Themes — Implementation Plan

## Overview

Full theme customization system: preset themes, up to 4 user-created custom themes with 8 color fields, modal-based editor with color picker, local persistence via SecureStore, server persistence via profile API.

---

## Decisions (Final)

| Question | Decision |
|----------|----------|
| Color picker library | `reanimated-color-picker` (installed) |
| Color selection UX | Centered floating card modal (LocationSearchSheet pattern), confirm/cancel |
| Exposed color count | 8 (background, cardColor, textPrimary, textSecondary, accent, gradient1, gradient2, gradient3) |
| Max custom themes | 4 per user |
| Custom theme UI | Modal (pageSheet for editor, floating card for color picker) |
| Preset themes | 4 curated (Sunset, Forest, Ocean, Rosé) alongside Dark/Light/OLED/Auto |
| Theme page navigation | Chevron on Theme card in Settings → dedicated Theme screen |
| Local persistence | SecureStore: `nstil_theme_mode`, `nstil_custom_themes`, `nstil_active_custom_id` |
| Server persistence | Phase C — `profiles` table columns |

---

## Phase A — Theme Page & Preset Themes ✅

Settings → Theme card → Theme page with Standard (4) + Presets (4) sections.

---

## Phase B — Custom Theme Editor ✅

### Final Data Model

```typescript
interface CustomThemeInput {
  readonly background: string;    // Root layout bg, shader base
  readonly cardColor: string;     // Surface, sheet, surfaceElevated (derived)
  readonly textPrimary: string;   // Headings, body text
  readonly textSecondary: string; // Subtitles, captions, textTertiary (derived)
  readonly accent: string;        // Buttons, icons, glass/glassBorder (derived)
  readonly gradient1: string;     // Ambient shader base color
  readonly gradient2: string;     // Ambient shader primary glow
  readonly gradient3: string;     // Ambient shader secondary glow
}

interface SavedCustomTheme {
  readonly id: string;
  readonly name: string;
  readonly input: CustomThemeInput;
  readonly built: BuiltCustomTheme;  // derived at load time, not persisted
}

// Store state
customThemes: readonly SavedCustomTheme[];  // max 4
activeCustomId: string | null;
```

### Store Actions

| Action | Description |
|--------|-------------|
| `saveCustomTheme(name, input)` | Creates new theme, activates it, persists |
| `updateCustomTheme(id, name, input)` | Updates existing theme in-place |
| `deleteCustomTheme(id)` | Removes theme, falls back to last remaining or dark |
| `activateCustomTheme(id)` | Sets mode to "custom" + activeCustomId |

### SecureStore Keys

| Key | Content |
|-----|---------|
| `nstil_theme_mode` | String: `dark\|light\|oled\|auto\|custom\|sunset\|forest\|ocean\|rose` |
| `nstil_custom_themes` | JSON array of `{ id, name, input }` (max 4, `built` derived on load) |
| `nstil_active_custom_id` | String ID of active custom theme |

### Builder Derivation (`buildCustomPalette`)

From 8 user inputs, derives full 25-token `ColorPalette` + `AmbientColorSet`:
- `isDark` auto-detected from `background` luminance
- `surface` = `cardColor` directly
- `surfaceElevated` = `cardColor` ± brightness
- `glass/glassBorder/glassHover` = `accent` at low opacity (5%/8%/10% dark, 60%/10%/70% light)
- `textTertiary` = `textSecondary` at 57% opacity
- `accentLight/accentMuted/onAccent` derived from `accent`
- Semantic colors (success/warning/error) fixed per dark/light
- Ambient colors from `gradient1/gradient2/gradient3` via `hexToNormalized4`

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ThemePage` | `components/settings/ThemePage/` | Standard + Presets + Custom sections with grid layout |
| `CustomThemeCard` | `components/settings/ThemePage/` | Saved theme card with 5-color preview, pencil edit button |
| `NewThemeCard` | `components/settings/ThemePage/` | "+" card, dashed border, disabled at max |
| `CustomThemeModal` | `components/settings/CustomThemeEditor/` | pageSheet modal with name input, editor, save/delete |
| `CustomThemeEditor` | `components/settings/CustomThemeEditor/` | 4 sections (Surfaces, Text, Accent, Gradient) with color rows |
| `ColorPickerSheet` | `components/settings/CustomThemeEditor/` | Centered floating card modal with reanimated-color-picker |
| `ColorRow` | `components/settings/CustomThemeEditor/` | Tappable row: label + hex + swatch |
| `ColorSection` | `components/settings/CustomThemeEditor/` | Section wrapper with title |

---

## Phase C — Backend Persistence & Sync

### Database Migration: `011_PROFILE_THEME.sql`

```sql
ALTER TABLE public.profiles
    ADD COLUMN theme_mode text NOT NULL DEFAULT 'dark'
        CONSTRAINT profiles_theme_mode_check
        CHECK (theme_mode IN ('dark','light','oled','auto','custom','sunset','forest','ocean','rose')),
    ADD COLUMN custom_themes jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN active_custom_theme_id text;
```

`custom_themes` stores array of `{ id, name, input }` objects (max 4). Each `input` has 8 string fields. `active_custom_theme_id` stores which custom theme is active when `theme_mode = 'custom'`.

### Backend Model Changes (`models/profile.py`)

New Pydantic models:
```python
class CustomThemeInputModel(BaseModel):
    background: str
    cardColor: str
    textPrimary: str
    textSecondary: str
    accent: str
    gradient1: str
    gradient2: str
    gradient3: str

class StoredCustomThemeModel(BaseModel):
    id: str
    name: str = Field(max_length=20)
    input: CustomThemeInputModel

VALID_THEME_MODES = {"dark","light","oled","auto","custom","sunset","forest","ocean","rose"}
MAX_CUSTOM_THEMES = 4
```

Updated models:
- `ProfileRow` — add `theme_mode: str`, `custom_themes: list[dict[str, object]]`, `active_custom_theme_id: str | None`
- `ProfileUpdate` — add optional `theme_mode`, `custom_themes`, `active_custom_theme_id` with validation
- `ProfileResponse` — add same 3 fields

Validation on `ProfileUpdate`:
- `theme_mode` must be in `VALID_THEME_MODES`
- `custom_themes` max length 4, each validated against `StoredCustomThemeModel`
- `active_custom_theme_id` must reference an ID in `custom_themes` if `theme_mode == "custom"`

### Backend Service Changes

No service changes needed — `ProfileService.update()` already handles arbitrary column updates via `to_update_dict()`. The cache layer (`CachedProfileService`) invalidates on update.

### Backend Tests

- Model tests: validate `CustomThemeInputModel`, reject invalid hex, reject >4 themes
- API tests: PATCH with theme fields → 200, PATCH with invalid theme_mode → 422

### Mobile Type Changes (`types/profile.ts`)

```typescript
interface Profile {
  // ...existing fields...
  readonly theme_mode: string;
  readonly custom_themes: readonly StoredCustomTheme[];
  readonly active_custom_theme_id: string | null;
}

interface StoredCustomTheme {
  readonly id: string;
  readonly name: string;
  readonly input: CustomThemeInput;
}

interface ProfileUpdate {
  readonly display_name?: string | null;
  readonly theme_mode?: string;
  readonly custom_themes?: readonly StoredCustomTheme[];
  readonly active_custom_theme_id?: string | null;
}
```

### Mobile Sync Logic

**On profile fetch (boot + tab layout):**
1. Compare `profile.theme_mode` with local store's `mode`
2. If different, apply server's theme: `setMode(profile.theme_mode)`
3. If `theme_mode === "custom"`, load `profile.custom_themes` into store and set `activeCustomId`

**On theme change (any setMode/save/update/delete/activate):**
1. Update Zustand store immediately (instant visual feedback)
2. Persist to SecureStore (offline resilience)
3. Fire `updateProfile({ theme_mode, custom_themes, active_custom_theme_id })` via existing `useUpdateProfile` hook (optimistic mutation)

### Execution Steps

| Step | Description | Status |
|------|-------------|--------|
| C1 | Database schema — columns inlined into `002_PROFILES.sql` | ✅ |
| C2 | Backend models — `CustomThemeInputModel`, `StoredCustomThemeModel`, update `ProfileRow`/`ProfileUpdate`/`ProfileResponse` | ✅ |
| C3 | Backend `to_update_dict()` — return type widened to `dict[str, object]` for JSONB | ✅ |
| C4 | Backend tests — model validation + API route tests | ✅ |
| C5 | Mobile `types/profile.ts` — `StoredCustomThemeData`, updated `Profile`/`ProfileUpdate` | ✅ |
| C6 | Mobile sync — `useThemeSync` hook, `syncFromProfile`/`getThemeSnapshot` store actions, wired in `(tabs)/_layout.tsx` | ✅ |

---

## Phase D — Custom Image Backgrounds (deferred)

## Phase E — Animated Video Backgrounds (deferred)
