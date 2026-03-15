# Activity Template Session History

## Context

Users can create activity templates (saved routes) and start sessions from them. Currently there's no way to see past performance on a template. The gym feature already has exercise history with personal bests and charts (`ExerciseHistoryModal` + `ExerciseHistoryChart`) — we replicate that pattern for activity templates.

## Decisions

- **Entry points:** Both templates page dropdown AND feed expanded card (only for sessions with `template_id`)
- **Personal bests:** Fastest avg pace + shortest completion time
- **Chart:** Line chart with selectable metric (pace, duration, avg speed, calories, steps)
- **Session stats:** All available stats per session row
- **No map** in history — stats only

## Approach

- New Supabase RPC function to fetch all sessions for a given template
- Reusable `useTemplateHistory` hook with lazy-loading (same pattern as gym exercise history)
- `TemplateHistoryModal` wrapping a `FullScreenModal` with PBs, chart, and session list
- `TemplateHistoryChart` adapted from `ExerciseHistoryChart` with a metric selector addition
- Integrate into templates page dropdown and feed expanded card

## History Modal Layout

```
┌────────────────────────────────────┐
│          Template Name             │  ← Header
│                                    │
│  ┌──────────────────────────────┐  │
│  │      Personal Bests          │  │
│  │                              │  │
│  │  ┌──────────┐ ┌───────────┐  │  │
│  │  │  5:32    │ │  28:15    │  │  │
│  │  │ min/km   │ │ duration  │  │  │
│  │  │ Jan 15   │ │ Feb 3     │  │  │
│  │  └──────────┘ └───────────┘  │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Pace][Duration][Speed][Cals]..   │  ← Metric selector (scrollable)
│  [1M] [3M] [6M] [1Y]              │  ← Range selector
│  ◄  Jan 3 - Mar 4  ►              │  ← Date range + nav arrows
│  ┌──────────────────────────────┐  │
│  │       📈 Line Chart          │  │  ← ECharts + Skia
│  └──────────────────────────────┘  │
│                                    │
│         Mar 1, 2026                │  ← Session date
│  ┌──────────────────────────────┐  │
│  │ Duration │ Moving  │ Distance│  │
│  │ Avg Pace │ Avg Spd │ Cals    │  │  ← StatCard grid
│  │ Steps    │         │         │  │
│  └──────────────────────────────┘  │
│                                    │
│         Feb 15, 2026               │  ← Next session...
│  ┌──────────────────────────────┐  │
│  │         ...                  │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## Implementation Steps

### 1. Supabase Migration

**Create:** `supabase/migrations/20260304120000_add_template_session_history.sql`

New RPC `activities_get_template_history(p_template_id uuid)` returning jsonb:

- Joins `sessions` with `session_stats` on `session_id`
- Filters by `template_id = p_template_id` AND `user_id = auth.uid()`
- Orders by `start_time DESC`
- Returns: `session_id`, `title`, `start_time`, `duration`, `distance_meters`, `moving_time_seconds`, `avg_pace`, `avg_speed`, `calories`, `steps`
- `DROP FUNCTION` first, then `CREATE FUNCTION` (per CLAUDE.md rules)

### 2. Type Definitions

**Modify:** `mobile/types/session.ts`

```typescript
export type TemplateHistorySession = {
  session_id: string;
  title: string;
  start_time: string;
  duration: number;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  avg_pace: number | null;
  avg_speed: number | null;
  calories: number | null;
  steps: number | null;
};

export type TemplateHistoryMetric = "avg_pace" | "duration" | "avg_speed" | "calories" | "steps";
```

### 3. Database Fetch Function

**Create:** `mobile/database/activities/get-template-history.ts`

Simple wrapper calling `supabase.rpc("activities_get_template_history")`. Follow pattern from `get-templates.ts`.

### 4. useTemplateHistory Hook

**Create:** `mobile/features/activities/templates/hooks/useTemplateHistory.ts`

Lazy-loading hook with `useState` for `historyTemplateId` + `isHistoryOpen`, and `useQuery` with `enabled` guard. Same pattern as gym exercise history state management in `gym-expanded.tsx`.

Exports: `history`, `historyError`, `isLoadingHistory`, `isHistoryOpen`, `openHistory(templateId)`, `closeHistory()`.

### 5. TemplateHistoryChart Component

**Create:** `mobile/features/activities/templates/components/TemplateHistoryChart.tsx`

Adapted from `mobile/features/gym/components/ExerciseHistoryChart.tsx`:

- Same ECharts + Skia renderer, blue line style (#93c5fd), gradient area fill
- Same range selector (1m/3m/6m/1y) with navigation arrows
- **Added:** Horizontal scrollable metric selector buttons above range selector
  - Metrics: avg_pace, duration, avg_speed, calories, steps
  - Same styling as range selector (bg-slate-800, active: bg-slate-700 + text-cyan-400)
- Data mapping: each session directly provides the stat value (unlike gym's "best set" extraction)
- Y-axis formatting adapts to metric:
  - `avg_pace` → `formatAveragePace`
  - `duration` → `formatDurationLong`
  - Others → plain number
- Reuse `getRangeStartDate()` and `getRangeDurationMs()` helpers

### 6. TemplateHistoryModal Component

**Create:** `mobile/features/activities/templates/components/TemplateHistoryModal.tsx`

Adapted from `mobile/features/gym/components/ExerciseHistoryModal.tsx`:

Props: `isOpen`, `onClose`, `isLoading`, `history: TemplateHistorySession[]`, `templateName`, `error?`

Inside `FullScreenModal`:

1. **Header:** Template name (centered, text-xl)
2. **Personal Bests:** `LinearGradient` card with two PBs side by side:
   - Fastest Avg Pace (lowest `avg_pace`) — `formatAveragePace` + date
   - Shortest Duration (lowest `duration`) — `formatDurationLong` + date
   - Computed via `useMemo`
3. **Chart:** `<TemplateHistoryChart history={history} />`
4. **Session list:** FlatList, each session in `LinearGradient` card with `StatCard` grid:
   - Row 1: Duration, Moving Time, Distance
   - Row 2: Avg Pace, Avg Speed
   - Row 3: Calories, Steps
   - Only show stats with non-null values

Loading/error/empty states matching gym's pattern.

### 7. Templates Page Integration

**Modify:** `mobile/features/activities/templates/cards/template-feed.tsx`

- Add `onHistory: () => void` to Props
- Add "History" option to `DropDownModal` options array (between Edit and Delete)
- Handle "history" case in the onChange switch

**Modify:** `mobile/app/activities/templates/index.tsx`

- Import `useTemplateHistory` hook + `TemplateHistoryModal`
- Track `historyTemplateName` in state for modal header
- Pass `onHistory` callback to each `ActivityTemplateCard`
- Render `TemplateHistoryModal`

### 8. Feed Expanded Card Integration

**Modify:** `mobile/features/activities/cards/activity-feed-expanded/activity.tsx`

- Import `History` icon from lucide-react-native
- Import `useTemplateHistory` + `TemplateHistoryModal`
- Add History button next to Share button, conditional on `activity_session.session.template_id` being non-null
- Render `TemplateHistoryModal` alongside existing modals

### 9. Translations

**Modify:** `mobile/locales/en/activities.json` and `mobile/locales/fi/activities.json`

Add to `templatesScreen`:

- `"history": "History"` / `"history": "Historia"`

Add new `templateHistory` section with: loading, loadError, noHistory, personalBests, fastestPace, shortestDuration, minPerKm, metric labels, range labels, noChartData, stat labels.

### 10. Regenerate Database Types

After `supabase db push`, regenerate types to add the new RPC signature to `database.types.ts`.

## Files Summary

| Action | File                                                                       |
| ------ | -------------------------------------------------------------------------- |
| CREATE | `supabase/migrations/20260304120000_add_template_session_history.sql`      |
| MODIFY | `mobile/types/session.ts`                                                  |
| CREATE | `mobile/database/activities/get-template-history.ts`                       |
| CREATE | `mobile/features/activities/templates/hooks/useTemplateHistory.ts`         |
| CREATE | `mobile/features/activities/templates/components/TemplateHistoryChart.tsx` |
| CREATE | `mobile/features/activities/templates/components/TemplateHistoryModal.tsx` |
| MODIFY | `mobile/features/activities/templates/cards/template-feed.tsx`             |
| MODIFY | `mobile/app/activities/templates/index.tsx`                                |
| MODIFY | `mobile/features/activities/cards/activity-feed-expanded/activity.tsx`     |
| MODIFY | `mobile/locales/en/activities.json`                                        |
| MODIFY | `mobile/locales/fi/activities.json`                                        |
| REGEN  | `mobile/types/database.types.ts`                                           |

## Key Patterns to Reuse

- `ExerciseHistoryModal.tsx` → structure for `TemplateHistoryModal`
- `ExerciseHistoryChart.tsx` → base for `TemplateHistoryChart` (+ metric selector)
- `StatCard` component (`mobile/components/StatCard.tsx`) → session stats grid
- `formatAveragePace`, `formatDurationLong`, `formatMeters` from `mobile/lib/formatDate.ts`
- `FullScreenModal` for modal wrapper

## Verification

1. Templates page → dropdown → "History" → modal shows PBs, chart, session list
2. Feed → expand activity session started from template → History button visible → same modal
3. Feed → expand activity session without template → no History button
4. Chart metric selector switches between stats
5. Range selector (1m/3m/6m/1y) and nav arrows work
6. Empty state for templates with no sessions
