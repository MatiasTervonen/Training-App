# Widget Settings — Menu Feature Spec

## Overview

Add a **Widgets** section to the mobile menu where users can configure their Android home screen widgets from inside the app. Two sub-pages:

1. **Quick Links** — choose which shortcut icons appear in the Quick Links widget
2. **Steps** — toggle goal bar, set daily step goal, toggle trend indicator

---

## Constraints & Context

| Concern | Detail |
|---|---|
| Platform | Mobile only (React Native / Expo) |
| Widget library | `react-native-android-widget` |
| Config storage | `AsyncStorage` — per-widget-instance, keyed by `widgetId` |
| Existing storage | `mobile/features/widgets/widget-storage.ts` |
| Existing constants | `mobile/features/widgets/widget-constants.ts` (`LINK_TARGETS`, `QuickLinksConfig`, `StepsConfig`, defaults) |
| Widget task handler | `mobile/features/widgets/widget-task-handler.tsx` |
| Widget refresh | `requestWidgetUpdate()` from `react-native-android-widget` |
| Locale namespace | `widgets` (already exists: `mobile/locales/en/widgets.json`, `mobile/locales/fi/widgets.json`) |
| Menu namespace | `menu` (`mobile/locales/en/menu.json`) |

### Current State

There is currently **no way to configure widgets**. The config is stored per-`widgetId` in AsyncStorage with default values, but no configuration UI exists yet.

### Key Design Decision: Global vs Per-Instance Config

**Decision: Global config (not per-widget-instance)**

The in-app settings page applies the same config to **all** widget instances of each type. This is the right approach because:
- Users don't think in terms of "widget instance IDs" — they think "my Quick Links widget"
- Most users have exactly one of each widget
- A global config is simpler: one AsyncStorage key per widget type, no widget ID selection UI

**Storage keys for global config:**
- `widget_quicklinks_global`
- `widget_steps_global`

**Behavior:**
- When the user saves config from the menu, it saves to the global key AND updates all existing widget instances by iterating known widget IDs
- When a new widget is added (via home screen), it reads the global config as default
- The per-instance config keys (`widget_quicklinks_{id}`, `widget_steps_{id}`) are no longer used once global config is in place

---

## Menu Integration

### New menu item: "Widgets"

Add a `LinkButton` in `mobile/app/menu/index.tsx` between "Security" and "Settings":

```tsx
<LinkButton label={t("menu.widgets")} href="/menu/widgets">
  <LayoutGrid color="#f3f4f6" />
</LinkButton>
```

Icon: `LayoutGrid` from `lucide-react-native`.

### New page: `mobile/app/menu/widgets/index.tsx`

A simple page with two `LinkButton` items leading to the sub-pages:

```
┌──────────────────────────┐
│       Widgets            │  ← title
│                          │
│ ┌──────────────────────┐ │
│ │ Quick Links        → │ │  ← LinkButton
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Steps              → │ │  ← LinkButton
│ └──────────────────────┘ │
│                          │
└──────────────────────────┘
```

- Wrapped in `PageContainer` (not `ModalPageWrapper`, since this is a menu sub-page like Profile/Security/Settings)
- Uses `useTranslation("widgets")`

---

## Quick Links Config Page

### Route: `mobile/app/menu/widgets/quick-links.tsx`

### UI Layout

```
┌──────────────────────────────┐
│     Configure Quick Links    │  ← title
│                              │
│  Select pages to show        │  ← subtitle
│                              │
│  ┌────────────────────────┐  │
│  │ Gym              [═══] │  │  ← Toggle ON
│  │ Notes             [═══] │  │  ← Toggle ON
│  │ Timer             [═══] │  │  ← Toggle ON
│  │ Activities        [═══] │  │  ← Toggle ON
│  │ Weight            [○  ] │  │  ← Toggle OFF
│  │ Reminders         [○  ] │  │  ← Toggle OFF
│  │ Todo              [○  ] │  │  ← Toggle OFF
│  │ Dashboard         [○  ] │  │  ← Toggle OFF
│  │ Disc Golf         [○  ] │  │  ← Toggle OFF
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │        Save            │  │  ← btn-base, disabled if none selected
│  └────────────────────────┘  │
│                              │
│  "Select at least one link"  │  ← warning, shown only when 0 selected
│                              │
└──────────────────────────────┘
```

### Behavior

1. **On mount:** Load global config from `widget_quicklinks_global`. If not found, use `DEFAULT_QUICK_LINKS_CONFIG`.
2. **Toggle list:** Render each item from `LINK_TARGETS` as a row with a label and `Toggle` component (`@/components/toggle`). Use localized labels (match current language — `labelEn`/`labelFi` from the constant, or add a translation key per link).
3. **Toggling:** Tapping the `Toggle` toggles its `key` in/out of the `selectedLinks` array (local state).
4. **Validation:** At least one link must be selected. If 0 selected, show the warning text and disable the Save button.
5. **Save:**
   - Save to `widget_quicklinks_global` in AsyncStorage
   - Call `requestWidgetUpdate("QuickLinks")` to refresh all Quick Links widget instances on the home screen
   - Show a success toast
   - Navigate back

### Toggle Row Layout

Each row is a `View` with `flexDirection: "row"`, `justifyContent: "space-between"`, `alignItems: "center"`:
- Left side: link label (`AppText`)
- Right side: `Toggle` component from `@/components/toggle`
  - `isOn={selectedLinks.includes(target.key)}`
  - `onToggle={() => toggleLink(target.key)}`
- Styled with `className` (NativeWind), no inline styles

---

## Steps Config Page

### Route: `mobile/app/menu/widgets/steps.tsx`

### UI Layout

```
┌──────────────────────────────┐
│     Configure Steps Widget   │  ← title
│                              │
│  ┌────────────────────────┐  │
│  │ Show daily goal    [✓] │  │  ← toggle switch
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ Daily goal             │  │
│  │ ┌──────────────────┐   │  │
│  │ │ 10000            │   │  │  ← numeric input (AppInput)
│  │ └──────────────────┘   │  │
│  └────────────────────────┘  │  ← only visible when showGoal is true
│                              │
│  ┌────────────────────────┐  │
│  │ Show trend         [✓] │  │  ← toggle switch
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │        Save            │  │  ← btn-base
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

### Behavior

1. **On mount:** Load global config from `widget_steps_global`. If not found, use `DEFAULT_STEPS_CONFIG`.
2. **Show daily goal toggle:** `Toggle` component from `@/components/toggle`. When off, the daily goal input is hidden.
3. **Daily goal input:** Numeric keyboard, default 10000. Validate: must be a positive integer > 0.
4. **Show trend toggle:** `Toggle` component from `@/components/toggle`.
5. **Save:**
   - Save to `widget_steps_global` in AsyncStorage
   - Call `requestWidgetUpdate("Steps")` to refresh all Steps widget instances
   - Show a success toast
   - Navigate back

---

## Storage Changes

### New functions in `widget-storage.ts`

```typescript
// Global config keys
const GLOBAL_QUICK_LINKS_KEY = "widget_quicklinks_global";
const GLOBAL_STEPS_KEY = "widget_steps_global";

// Get/save global configs
export async function getGlobalQuickLinksConfig(): Promise<QuickLinksConfig>
export async function saveGlobalQuickLinksConfig(config: QuickLinksConfig): Promise<void>
export async function getGlobalStepsConfig(): Promise<StepsConfig>
export async function saveGlobalStepsConfig(config: StepsConfig): Promise<void>
```

### Update widget-task-handler.tsx

When a new widget is added (`WIDGET_ADDED`):
- Read the global config first
- If global config exists, use it as the initial config for this widget instance
- Save it as the per-instance config too (so the widget renders correctly)

---

## File Changes Summary

### New files

| File | Purpose |
|---|---|
| `mobile/app/menu/widgets/index.tsx` | Widgets hub page (two LinkButtons) |
| `mobile/app/menu/widgets/quick-links.tsx` | Quick Links config page |
| `mobile/app/menu/widgets/steps.tsx` | Steps config page |

### Modified files

| File | Change |
|---|---|
| `mobile/app/menu/index.tsx` | Add "Widgets" LinkButton |
| `mobile/features/widgets/widget-storage.ts` | Add global config get/save functions |
| `mobile/features/widgets/widget-task-handler.tsx` | Read global config on `WIDGET_ADDED` |
| `mobile/locales/en/menu.json` | Add `"menu.widgets": "Widgets"` |
| `mobile/locales/fi/menu.json` | Add `"menu.widgets": "Widgetit"` |
| `mobile/locales/en/widgets.json` | Add `"widgets.hub.title"`, `"widgets.hub.quickLinks"`, `"widgets.hub.steps"` |
| `mobile/locales/fi/widgets.json` | Add `"widgets.hub.title"`, `"widgets.hub.quickLinks"`, `"widgets.hub.steps"` |

### No database changes

All config is stored client-side in AsyncStorage. No Supabase migrations needed.

---

## Translation Keys to Add

### `mobile/locales/en/menu.json` — under `"menu"` object

```json
"widgets": "Widgets"
```

### `mobile/locales/fi/menu.json` — under `"menu"` object

```json
"widgets": "Widgetit"
```

### `mobile/locales/en/widgets.json` — add `"hub"` section

```json
{
  "widgets": {
    "hub": {
      "title": "Widgets",
      "quickLinks": "Quick Links",
      "steps": "Steps"
    },
    "quickLinks": { ... },
    "steps": { ... }
  }
}
```

### `mobile/locales/fi/widgets.json` — add `"hub"` section

```json
{
  "widgets": {
    "hub": {
      "title": "Widgetit",
      "quickLinks": "Pikalinkit",
      "steps": "Askeleet"
    },
    "quickLinks": { ... },
    "steps": { ... }
  }
}
```

---

## Implementation Order

1. **Storage** — Add global config functions to `widget-storage.ts`
2. **Translations** — Add all new translation keys (menu + widgets)
3. **Widgets hub page** — Create `mobile/app/menu/widgets/index.tsx`
4. **Quick Links config page** — Create `mobile/app/menu/widgets/quick-links.tsx`
5. **Steps config page** — Create `mobile/app/menu/widgets/steps.tsx`
6. **Menu integration** — Add "Widgets" LinkButton to `mobile/app/menu/index.tsx`
7. **Widget task handler** — Update `WIDGET_ADDED` to read global config
8. **Test** — Verify config saves, widget refreshes, navigation works

---

## Testing Checklist

- [ ] "Widgets" button appears in the menu between Security and Settings
- [ ] Tapping "Widgets" navigates to the hub page
- [ ] Hub page shows "Quick Links" and "Steps" buttons
- [ ] Quick Links page loads current config (or defaults)
- [ ] Toggling checkboxes updates the selection
- [ ] Cannot save with 0 links selected
- [ ] Saving updates the home screen widget immediately
- [ ] Steps page loads current config (or defaults)
- [ ] Toggling "Show daily goal" hides/shows the goal input
- [ ] Toggling "Show trend" works
- [ ] Saving steps config updates the home screen widget
- [ ] Back navigation works correctly from all pages
- [ ] Translations display correctly in English and Finnish
- [ ] Adding a new widget from home screen picks up global config
