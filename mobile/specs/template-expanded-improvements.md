# Template Expanded Card Improvements

## Context

The template expanded card (shown when user taps a template to start a session) is bare compared to the activity feed expanded card. It currently shows: created/updated dates, template name, activity name, distance, notes, a map with a lock/move toggle, and a "Start Activity" button. This feature improves the expanded card with a fullscreen map, history access, and summary stats from past sessions.

## Decisions

- **Fullscreen map button:** Replace the lock/move toggle on the template map with a fullscreen button (matching the feed expanded card pattern). The fullscreen modal uses `FullScreenMapModal` adapted for `templateSummary` data.
- **History button:** Add a History icon button to the expanded card header so users can check past performance before starting. Currently history is only accessible from the feed card dropdown.
- **Last session summary:** Show "last completed" date and total completion count. Lightweight query addition to the existing `activities_get_templates` RPC.
- **Average stats from history:** Show key averages (avg duration, avg pace, avg distance) from past sessions below the template info card. Gives the user a benchmark before they start.

## Template Expanded Layout (Updated)

```
┌────────────────────────────────────┐
│  Created: Jan 15, 2026             │
│  Updated: Feb 3, 2026              │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Template Name        [H]   │  │  ← [H] = History icon button
│  │  ─────────────────────────── │  │
│  │  Activity Name               │  │
│  │  Distance: 5.2 km            │  │
│  │  Notes: Morning route...     │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │         MAP PREVIEW          │  │
│  │    (non-interactive)     [⛶] │  │  ← Fullscreen button (replaces lock/move)
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │     Stats from History       │  │  ← Only shown if sessions exist
│  │                              │  │
│  │  Completed: 12 times         │  │
│  │  Last: 3 days ago            │  │
│  │                              │  │
│  │  Avg Duration │ Avg Pace     │  │
│  │  Avg Distance │ Avg Speed    │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ ▶  Start Activity ]             │  ← Existing button
│                                    │
└────────────────────────────────────┘
```

## Implementation Steps

### 1. Supabase Migration — Extend `activities_get_templates` RPC

**Create:** `supabase/migrations/YYYYMMDDHHmmss_add_template_stats_to_get_templates.sql`

Drop and recreate `activities_get_templates` to include aggregated stats from past sessions:

- `last_completed_at` — most recent `start_time` from sessions with matching `template_id`
- `times_completed` — count of sessions with matching `template_id`
- `avg_duration` — average `duration` from `session_stats`
- `avg_pace` — average `avg_pace` from `session_stats` (exclude nulls)
- `avg_speed` — average `avg_speed` from `session_stats` (exclude nulls)
- `avg_distance` — average `distance_meters` from `session_stats` (exclude nulls)

Use a LEFT JOIN + subquery on `sessions` joined with `session_stats`, grouped by `template_id`. This keeps it as one query instead of N+1.

Remember: `DROP FUNCTION` first, then `CREATE FUNCTION`. Use `SECURITY INVOKER`. Use `auth.uid()` directly.

### 2. Update Type Definitions

**Modify:** `mobile/types/session.ts`

Extend `templateSummary.template` with new optional fields:

```typescript
template: {
  // ... existing fields
  last_completed_at: string | null;
  times_completed: number;
  avg_duration: number | null;
  avg_pace: number | null;
  avg_speed: number | null;
  avg_distance: number | null;
};
```

### 3. Replace Template Map with Fullscreen Pattern

**Modify:** `mobile/features/activities/components/templateMap.tsx`

Replace the lock/move toggle button with a fullscreen button:

- Remove `mapActive` state, `toggleMapActive`, the `Move`/`Lock` imports
- Map is always non-interactive (`pointerEvents="none"`) — same as feed expanded map
- Add `Fullscreen` icon button (bottom-right) that calls `setFullScreen(true)`
- Remove `setSwipeEnabled` prop — no longer needed since map is never interactive
- Use user's default line color from `useActivitySettingsStore` (currently hardcoded blue)

Updated props:
```typescript
type MapProps = {
  template: templateSummary;
  setFullScreen: (value: boolean) => void;
};
```

### 4. Create Template Fullscreen Map Modal

**Create:** `mobile/features/activities/components/TemplateFullScreenMapModal.tsx`

Adapted from `features/activities/cards/activity-feed-expanded/components/fullScreenMap.tsx` but works with `templateSummary` data:

- Same controls: toggle map style (Layers2), toggle line color (Route), recenter (LocateFixed)
- Same close button (CircleX, top-right)
- **No SessionStats** at bottom (templates don't have session stats — just the map)
- Route is always `LineString` (templates store simple LineString, no MultiLineString handling needed)
- Uses `MAP_STYLES`, `LINE_COLORS` from `mapConstants`

Props:
```typescript
type Props = {
  template: templateSummary;
  fullScreen: boolean;
  setFullScreen: (value: boolean) => void;
};
```

### 5. Update Template Expanded Card

**Modify:** `mobile/features/activities/templates/cards/template-expanded.tsx`

Changes:

1. **Add props:** `onHistory: () => void`
2. **History button:** Add `History` icon button next to the template name in the header (same pattern as feed expanded card — icon in top-right of the info card)
3. **Fullscreen map state:** Add `useState<boolean>(false)` for fullscreen, pass to updated `TemplateMap` and new `TemplateFullScreenMapModal`
4. **Remove** `setSwipeEnabled` / `useFullScreenModalConfig` — template map no longer needs swipe control
5. **Stats section:** Below the map, if `item.template.times_completed > 0`, show a `LinearGradient` card with:
   - "Completed X times" + "Last: [relative date]" header
   - StatCard grid with: Avg Duration, Avg Pace, Avg Distance, Avg Speed (only show non-null values)
   - Use `StatCard` component, same as `SessionStats` uses
6. **Render** `TemplateFullScreenMapModal` alongside existing content
7. **Only show map section** if `item.route` is not null (already the case)

### 6. Update Templates Page

**Modify:** `mobile/app/activities/templates/index.tsx`

Pass `onHistory` callback to `ActivityTemplateExpanded`:

```tsx
<ActivityTemplateExpanded
  item={expandedItem}
  onStartActivity={() => startActivity(expandedItem)}
  isStartingActivity={isStartingActivity}
  onHistory={() =>
    openHistory(expandedItem.template.id, expandedItem.template.name)
  }
/>
```

### 7. Translations

**Modify:** `mobile/locales/en/activities.json` and `mobile/locales/fi/activities.json`

Add to `templatesScreen`:

**English:**
- `"timesCompleted": "Completed {{count}} times"`
- `"lastCompleted": "Last"`
- `"avgDuration": "Avg Duration"`
- `"avgPace": "Avg Pace"`
- `"avgSpeed": "Avg Speed"`
- `"avgDistance": "Avg Distance"`
- `"statsTitle": "History Stats"`

**Finnish:**
- `"timesCompleted": "Suoritettu {{count}} kertaa"`
- `"lastCompleted": "Viimeisin"`
- `"avgDuration": "Keskim. kesto"`
- `"avgPace": "Keskim. vauhti"`
- `"avgSpeed": "Keskim. nopeus"`
- `"avgDistance": "Keskim. matka"`
- `"statsTitle": "Historiatilastot"`

### 8. Regenerate Database Types

After `supabase db push`, regenerate types to update the RPC return type in `database.types.ts`.

## Files Summary

| Action | File |
| ------ | ---- |
| CREATE | `supabase/migrations/YYYYMMDDHHmmss_add_template_stats_to_get_templates.sql` |
| MODIFY | `mobile/types/session.ts` |
| MODIFY | `mobile/features/activities/components/templateMap.tsx` |
| CREATE | `mobile/features/activities/components/TemplateFullScreenMapModal.tsx` |
| MODIFY | `mobile/features/activities/templates/cards/template-expanded.tsx` |
| MODIFY | `mobile/app/activities/templates/index.tsx` |
| MODIFY | `mobile/locales/en/activities.json` |
| MODIFY | `mobile/locales/fi/activities.json` |
| REGEN  | `mobile/types/database.types.ts` |

## Key Patterns to Reuse

- `FullScreenMapModal` (feed expanded) → base for `TemplateFullScreenMapModal`
- Feed expanded map → fullscreen button pattern for template map
- `StatCard` component → stats grid in expanded card
- `formatAveragePace`, `formatDurationLong`, `formatMeters` from `lib/formatDate.ts`
- `LinearGradient` card style from `SessionStats`
- Feed expanded card History icon button → same pattern for template expanded header
- `useTemplateHistory` hook already exists — just wire it up

## Verification

1. Templates page → expand template with past sessions → see stats section with averages + completion count
2. Templates page → expand template with no past sessions → stats section hidden, only map + start button
3. Template map shows fullscreen button (not lock/move toggle)
4. Fullscreen map opens with style/color/recenter controls
5. History button in expanded card opens `TemplateHistoryModal` with full history
6. Template with no route → no map or fullscreen button shown
7. All text appears correctly in both EN and FI
