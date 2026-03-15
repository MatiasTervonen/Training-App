# Activity Map Settings

## Context
Activities maps currently hardcode `Mapbox.StyleURL.Dark` as the default style and blue as the default line color. The same `MAP_STYLES` and `LINE_COLORS` arrays are duplicated across 4 map components. This feature adds a settings page (like gym has) where users can choose their preferred default map style and route line color, and centralizes the duplicated map constants.

**Storage: Local only** (AsyncStorage via Zustand, same as gym settings). No Supabase sync needed — these are purely visual preferences.

## Requirements
- **Default map style**: User can choose between Dark, Satellite Street, or Street
- **Default line color**: User can choose between blue, red, green, purple, or yellow
- **Settings persist**: Preferences survive app restarts (AsyncStorage)
- **Non-destructive**: Users can still toggle styles/colors at runtime via existing map control buttons — the setting only controls the initial default
- **Centralized constants**: Extract duplicated `MAP_STYLES` and `LINE_COLORS` into a shared file

## How It Works

### Settings Flow
1. User navigates to Activities → Settings (new link at bottom of activities menu)
2. Settings page shows map style selector and line color selector
3. User taps their preferred option → stored immediately via Zustand + AsyncStorage
4. Next time any map renders, it uses the selected defaults as initial state

### Settings Page Layout

```
┌─────────────────────────────────┐
│       Activity Settings         │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │     LIVE MAP PREVIEW        ││
│  │  (shows a sample route      ││
│  │   with current style +      ││
│  │   line color, updates       ││
│  │   instantly on change)      ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  Default Map Style              │
│  Choose the default map style   │
│                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │ Dark  │ │Satell.│ │Street │ │
│  │  ✓    │ │       │ │       │ │
│  └───────┘ └───────┘ └───────┘ │
│                                 │
│  Default Route Color            │
│  Choose the default route color │
│                                 │
│  🔵  🔴  🟢  🟣  🟡            │
│  ✓                              │
│                                 │
└─────────────────────────────────┘
```

**Live map preview** at the top of the settings page:
- Shows a Mapbox map with a hardcoded sample route (a simple zigzag/loop shape using fixed coordinates — e.g., a small loop in Helsinki or any arbitrary location)
- Map style and line color update instantly when user taps the selectors below
- Map is non-interactive (touch disabled) — purely a visual preview
- Height: ~250px
- Uses the same line rendering style (glow + core layers) as the real map components

Map styles shown as labeled buttons/chips with a checkmark on the selected one.
Line colors shown as colored circles with a checkmark/border on the selected one.

---

## Files to Create

### 1. `features/activities/lib/mapConstants.ts` — Shared Map Constants

Centralize the duplicated `MAP_STYLES` and `LINE_COLORS` arrays.

```typescript
import Mapbox from "@rnmapbox/maps";

export const MAP_STYLES = [
  { url: Mapbox.StyleURL.Dark, labelKey: "dark" },
  { url: Mapbox.StyleURL.SatelliteStreet, labelKey: "satellite" },
  { url: Mapbox.StyleURL.Street, labelKey: "street" },
];

export const LINE_COLORS = [
  { glow: "rgba(59,130,246,0.4)", core: "#3b82f6", labelKey: "blue" },   // blue
  { glow: "rgba(239,68,68,0.4)", core: "#ef4444", labelKey: "red" },     // red
  { glow: "rgba(34,197,94,0.4)", core: "#22c55e", labelKey: "green" },   // green
  { glow: "rgba(168,85,247,0.4)", core: "#a855f7", labelKey: "purple" }, // purple
  { glow: "rgba(234,179,8,0.4)", core: "#eab308", labelKey: "yellow" },  // yellow
];
```

### 2. `lib/stores/activitySettingsStore.ts` — Activity Settings State

New Zustand store with AsyncStorage persistence (follow `gymSettingsStore.ts` pattern).

```typescript
interface ActivitySettings {
  defaultMapStyle: string;       // Mapbox style URL, default: Mapbox.StyleURL.Dark
  defaultLineColorIndex: number; // index into LINE_COLORS, default: 0 (blue)
}

interface ActivitySettingsStore extends ActivitySettings {
  setDefaultMapStyle: (style: string) => void;
  setDefaultLineColorIndex: (index: number) => void;
}
```

**Implementation details:**
- Zustand + `persist` middleware with AsyncStorage (key: `"activity-settings-store"`)
- Same storage adapter pattern as `gymSettingsStore.ts`

### 3. `app/activities/settings/index.tsx` — Activity Settings Page

New settings page following the gym settings pattern.

**Implementation details:**
- Wrap with `ModalPageWrapper`
- Use `PageContainer` for layout
- **Live map preview** at the top (~250px height):
  - Render a `Mapbox.MapView` with touch disabled (`pointerEvents="none"`)
  - Use `styleURL` bound to the currently selected map style state
  - Draw a hardcoded sample route as a `ShapeSource` + `LineLayer` (glow + core) using the currently selected line color
  - Use a small hardcoded coordinate set (e.g., a simple loop/zigzag shape) — no real GPS data needed
  - Camera bounds fit the sample route with padding
  - When user changes style or color below, the map updates instantly
- **Map style selector**: 3 `AnimatedButton` chips in a row, selected one highlighted (e.g., blue border/background), others neutral
- **Line color selector**: 5 colored circle `AnimatedButton`s in a row, selected one has a white border or checkmark
- Read/write from `activitySettingsStore`
- Use `useTranslation("activities")` for all text

---

## Files to Modify

### 1. `app/activities/index.tsx` — Add Settings Link

Add a divider and settings link button at the bottom (same pattern as gym).

```tsx
// Add after the last LinkButton:
<View className="border border-gray-400 rounded-md" />
<LinkButton label={t("activities.settings.title")} href="/activities/settings">
  <Settings color="#f3f4f6" className="ml-2" />
</LinkButton>
```

Import `Settings` from `lucide-react-native`.

### 2. `features/activities/cards/activity-feed-expanded/components/map.tsx`

**Changes:**
- Import `MAP_STYLES`, `LINE_COLORS` from `@/features/activities/lib/mapConstants`
- Import `useActivitySettingsStore`
- Replace inline `MAP_STYLES` array (lines 100-104) with imported constant
- Replace inline `LINE_COLORS` array (lines 26-32) with imported constant
- Replace `useState(Mapbox.StyleURL.Dark)` with `useState(defaultMapStyle)` from store
- Replace `useState(0)` for colorIndex with `useState(defaultLineColorIndex)` from store

### 3. `features/activities/cards/activity-feed-expanded/components/fullScreenMap.tsx`

**Changes:**
- Import `MAP_STYLES`, `LINE_COLORS` from `@/features/activities/lib/mapConstants`
- Import `useActivitySettingsStore`
- Replace inline `MAP_STYLES` array (lines 96-100) with imported constant
- Replace inline `LINE_COLORS` array (lines 88-94) with imported constant
- Replace `useState(Mapbox.StyleURL.Dark)` (line 102) with `useState(defaultMapStyle)` from store
- Replace `useState(0)` (line 103) for colorIndex with `useState(defaultLineColorIndex)` from store

### 4. `features/activities/components/fullScreenMap.tsx`

**Changes:**
- Import `MAP_STYLES` from `@/features/activities/lib/mapConstants`
- Import `useActivitySettingsStore`
- Replace inline `MAP_STYLES` array (lines 144-148) with imported constant
- Replace `useState(Mapbox.StyleURL.Dark)` (line 56) with `useState(defaultMapStyle)` from store
- Note: This component (live tracking) does NOT have line color toggle, so only map style needs updating

### 5. `features/activities/components/templateMap.tsx`

**Changes:**
- Import `useActivitySettingsStore`
- Replace hardcoded `Mapbox.StyleURL.Dark` (line 79) with `defaultMapStyle` from store
- Note: This component has no style toggle button or line color toggle

### 6. `locales/en/activities.json`

**Add** under `"activities"`:

```json
"settings": {
  "title": "Activity Settings",
  "defaultMapStyle": "Default Map Style",
  "defaultMapStyleDescription": "Choose the default map style for activities",
  "defaultLineColor": "Default Route Color",
  "defaultLineColorDescription": "Choose the default route line color",
  "mapStyles": {
    "dark": "Dark",
    "satellite": "Satellite",
    "street": "Street"
  },
  "lineColors": {
    "blue": "Blue",
    "red": "Red",
    "green": "Green",
    "purple": "Purple",
    "yellow": "Yellow"
  }
}
```

### 7. `locales/fi/activities.json`

**Add** under `"activities"`:

```json
"settings": {
  "title": "Aktiviteettiasetukset",
  "defaultMapStyle": "Oletuskartttyyli",
  "defaultMapStyleDescription": "Valitse aktiviteettien oletuskartttyyli",
  "defaultLineColor": "Oletusreitin väri",
  "defaultLineColorDescription": "Valitse oletusreitin viivan väri",
  "mapStyles": {
    "dark": "Tumma",
    "satellite": "Satelliitti",
    "street": "Katu"
  },
  "lineColors": {
    "blue": "Sininen",
    "red": "Punainen",
    "green": "Vihreä",
    "purple": "Violetti",
    "yellow": "Keltainen"
  }
}
```

---

## Verification

1. Build with `npx expo run:android`

### Settings Page
2. Navigate to Activities → Activity Settings (link at bottom)
3. Verify live map preview is visible at the top with a sample route
4. Verify map style selector shows 3 options with Dark selected by default
5. Verify line color selector shows 5 colors with blue selected by default
6. Tap "Satellite" → verify map preview instantly switches to satellite view
7. Tap "Red" color → verify the route line on the preview instantly turns red
8. Close settings → reopen → verify selections persisted and preview matches

### Map Defaults
6. Open an activity session with a route (My Sessions → expand one)
7. Verify the map uses the selected default style (Satellite) and line color (Red)
8. Toggle map style via the Layers2 button → verify runtime toggle still works
9. Toggle line color via the Route button → verify runtime toggle still works

### Template Map
10. Open an activity template with a route
11. Verify the template map uses the selected default style

### Live Tracking Map
12. Start an activity with GPS tracking
13. Verify the live map uses the selected default style

### Persistence
14. Kill and reopen the app
15. Verify settings are still saved and maps use the saved defaults
