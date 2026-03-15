# Activity Session Share Card

## Context
After completing a gym workout, users land on a "Workout Finished" page where they can share a styled summary card. Activity sessions currently just redirect to `/dashboard` after saving — no summary, no share option. We want the same share card experience for activities, enhanced with a map snapshot of the route and user-customizable stat selection.

## Approach
- Create a new "Activity Finished" page at `app/activities/activity-finished/index.tsx`
- Generate a styled 1080x1080 image with an embedded map snapshot and flexible stat grid
- Use a hidden `@rnmapbox/maps` MapView to render the route, then call `takeSnap()` to get a static image that Skia can capture (Skia's `makeImageFromView` cannot capture native MapView directly)
- Move the existing generic `useShareCard` hook from `features/gym/hooks/` to `lib/hooks/` (it's fully reusable — just ref capture + share)
- Sessions without GPS are still shareable with a stats-only card (no map section)
- Users can toggle which stats appear on the card (2-6 stats) via chip buttons

## Share Card Design

### With Map (GPS session)
```
┌──────────────────────────────────┐
│  [App icon]  MyTrack              │  ← App branding
│                                   │
│        Morning Run                │  ← Session title
│      Running · Mar 3              │  ← Activity name + date
│                                   │
│  ┌──────────────────────────────┐ │
│  │                              │ │
│  │       Map Snapshot           │ │  ← ~400px, route on dark map
│  │       (route line)           │ │
│  │                              │ │
│  └──────────────────────────────┘ │
│                                   │
│  ┌────────┐ ┌────────┐ ┌───────┐ │
│  │ 5.2 km │ │ 32:15  │ │ 6:12  │ │  ← User-selected stats
│  │Distance│ │Duration│ │ Pace  │ │     (2-7 in flexible grid, max 6 selected)
│  └────────┘ └────────┘ └───────┘ │
│  ┌────────┐ ┌────────┐           │
│  │  320   │ │  4500  │           │
│  │Calories│ │ Steps  │           │
│  └────────┘ └────────┘           │
│                                   │
│            MyTrack                │  ← Footer watermark
└──────────────────────────────────┘
```

### Without Map (no GPS session)
```
┌──────────────────────────────────┐
│  [App icon]  MyTrack              │  ← App branding
│                                   │
│           Walking                 │  ← Activity name (large)
│        Evening Walk               │  ← Session title
│          Mar 3                    │  ← Date
│                                   │
│  ┌──────────────────────────┐    │
│  │         45 min           │    │  ← Duration (large, centered)
│  │        Duration          │    │
│  └──────────────────────────┘    │
│  ┌──────────┐  ┌──────────┐      │
│  │   280    │  │   3200   │      │  ← Smaller stats below
│  │ Calories │  │  Steps   │      │
│  └──────────┘  └──────────┘      │
│                                   │
│            MyTrack                │  ← Footer watermark
└──────────────────────────────────┘
```

Without GPS, only Duration, Calories, and Steps (if > 0) are available.

Stat boxes use the same styling as gym ShareCard's StatBox: `border-blue-500 border rounded-lg bg-slate-950/50`. Background is `LinearGradient` with `["#1e3a8a", "#0f172a", "#0f172a"]`.

Stats grid layout adapts by count: 2→1 row of 2, 3→1 row of 3, 4→2×2, 5→row of 3 + row of 2, 6→2×3.

## Activity Finished Page Design

```
┌──────────────────────────────┐
│                              │
│   Activity Finished! 🎉      │  ← Header with confetti
│                              │
│  ┌────────────────────────┐  │
│  │  Share Card Preview    │  │  ← Scaled 30-40% to fit
│  │  (with map + stats)    │  │
│  └────────────────────────┘  │
│                              │
│  Select stats:               │
│  [Duration✓] [Distance✓]     │  ← Toggle chips
│  [Pace✓] [Calories✓]         │     (tap to include/exclude)
│  [Steps] [Moving Time]       │     min 2 required
│                              │
│  [🔗 Share Activity]         │  ← Share button
│  [Done]                      │  ← Navigate to dashboard
└──────────────────────────────┘
```

## Available Stats

All 7 stats from the expanded session view are available. Max 6 can be selected at once, minimum 2.

| Stat | Key | Available When | Formatter |
|------|-----|----------------|-----------|
| Duration | `duration` | Always | `formatDuration()` from `lib/formatDate.ts` |
| Calories | `calories` | Always (MET × weight × time) | Integer string |
| Distance | `distance` | GPS enabled & distance > 0 | `formatMeters()` from `lib/formatDate.ts` |
| Avg Pace | `avgPace` | GPS enabled & pace > 0 | `formatAveragePace()` + "min/km" |
| Avg Speed | `avgSpeed` | GPS enabled & speed > 0 | `"{value} km/h"` |
| Moving Time | `movingTime` | GPS enabled & movingTime > 0 | `formatDuration()` |
| Steps | `steps` | Steps > 0 | Integer string |

Default: all available stats are selected (up to 6). If all 7 are available, Avg Speed starts unselected since Avg Pace covers the same info. Minimum 2 must remain selected.

## Implementation Steps

### 1. Move `useShareCard` to shared location
**Move: `features/gym/hooks/useShareCard.ts` → `lib/hooks/useShareCard.ts`**

Add a `filenamePrefix` parameter (default `"share-"`) instead of hardcoded `"workout-"`. Update gym imports in:
- `features/gym/components/ShareModal.tsx`
- `app/gym/training-finished/index.tsx`

### 2. Create activity session summary store
**New file: `lib/stores/activitySessionSummaryStore.ts`**

Same pattern as `lib/stores/sessionSummaryStore.ts`. Non-persisted (ephemeral).

```ts
type ActivitySessionSummary = {
  title: string
  date: string                         // ISO string
  duration: number                     // seconds
  activityName: string | null          // e.g. "Running"
  hasRoute: boolean
  route: FullActivitySession["route"]  // reuse type from types/models.ts
  distance: number | null              // meters
  movingTime: number | null            // seconds
  averagePace: number | null           // seconds per km
  averageSpeed: number | null          // km/h
  steps: number | null
  calories: number | null
}
```

### 3. Create share card utility functions
**New file: `features/activities/lib/activityShareCardUtils.ts`**

- `getAvailableStats(summary, t)` → returns array of `{ key, label, value }` for all stats that have data
- Uses existing formatters from `lib/formatDate.ts`

### 4. Create the ActivityShareCard component
**New file: `features/activities/components/share/ActivityShareCard.tsx`**

- `forwardRef<View, ActivityShareCardProps>` for Skia capture
- Fixed size: `w-[1080px] h-[1080px]` with `collapsable={false}`
- Props: `title, date, activityName, mapSnapshotUri: string | null, selectedStats: { key, label, value }[]`
- Map snapshot rendered as `<Image source={{ uri: mapSnapshotUri }}>` (Skia can capture this)
- Reuse `StatBox` pattern from `features/gym/components/ShareCard.tsx`
- Two layout modes based on `mapSnapshotUri` presence

### 5. Create stat toggle chips component
**New file: `features/activities/components/share/StatToggleChips.tsx`**

- Row of `AnimatedButton` pill chips with `flexWrap`
- Selected: `bg-blue-700 border-blue-500`, unselected: `bg-transparent border-gray-500`
- Props: `availableStats, selectedKeys: Set<string>, onToggle: (key) => void`
- Enforce minimum 2 selected (show toast on invalid deselect)

### 6. Create useMapSnapshot hook
**New file: `features/activities/components/share/useMapSnapshot.ts`**

Encapsulates the hidden MapView → snapshot flow:
- Computes route GeoJSON feature and bounds from route data (reuse logic from `features/activities/cards/activity-feed-expanded/components/map.tsx` lines 44-76)
- Provides `onDidFinishLoadingMap` callback → calls `mapViewRef.current.takeSnap(true)` → stores URI
- Returns `{ mapViewRef, mapSnapshotUri, isLoadingSnapshot, routeFeature, bounds, onMapDidFinishLoading }`

The hidden MapView is rendered by the parent with `style={{ position: 'absolute', left: -9999 }}` and real dimensions (~960×400). It needs real dimensions to render tiles.

### 7. Create the activity-finished page
**New file: `app/activities/activity-finished/index.tsx`**

Follow pattern of `app/gym/training-finished/index.tsx`:
- Read summary from `useActivitySessionSummaryStore`
- If route exists: render hidden MapView (offscreen) using `useMapSnapshot` hook
- Scaled `ActivityShareCard` preview (same scaling logic as gym: `(containerWidth - 40) / 1080`, max 0.4)
- `StatToggleChips` for stat selection (managed via `selectedKeys` state, default: all available)
- Share button uses `useShareCard("activity-")` → captures card + opens share sheet
- Done `LinkButton` navigates to `/dashboard`
- `beforeRemove` listener clears store (same pattern as gym)
- Graceful fallback: if no summary, show only Done button

### 8. Update useSaveSession to populate store and navigate
**Modify: `features/activities/hooks/useSaveSession.ts`**

Add new params to the hook: `activityName, baseMet, userWeight, movingTimeSeconds, averagePacePerKm, averageSpeed`

After successful `saveActivitySession()`, before `router.push`:
```ts
const hasRoute = allowGPS && cleanTrack.length > 0;
let route = null;
if (hasRoute) {
  const coords = cleanTrack.map(p => [p.longitude, p.latitude] as [number, number]);
  route = { type: "LineString" as const, coordinates: coords };
}
const calories = Math.round(baseMet * userWeight * (durationInSeconds / 3600));

useActivitySessionSummaryStore.getState().setSummary({
  title,
  date: start_time,
  duration: durationInSeconds,
  activityName,
  hasRoute,
  route,
  distance: hasRoute ? meters : null,
  movingTime: hasRoute ? movingTimeSeconds : null,
  averagePace: hasRoute ? averagePacePerKm : null,
  averageSpeed: hasRoute ? averageSpeed : null,
  steps: steps > 0 ? steps : null,
  calories,
});
router.push("/activities/activity-finished");
```

### 9. Update start-activity page to pass additional params
**Modify: `app/activities/start-activity/index.tsx`**

Pass the additional values to `useSaveActivitySession`. These values are already computed by existing hooks on this page (`useCountDistance`, `useMovingTimeFromTrack`, `useAveragePace`, `useLiveStepCounter`).

### 10. Create ActivityShareModal for expanded card
**New file: `features/activities/components/share/ActivityShareModal.tsx`**

Same pattern as `features/gym/components/ShareModal.tsx`:
- Props: `visible, onClose, activitySession: FullActivitySession`
- If route exists: renders hidden MapView using `useMapSnapshot`
- Scaled `ActivityShareCard` preview
- `StatToggleChips` for stat selection
- Share/Close buttons at bottom
- Computes available stats from `FullActivitySession.stats`

### 11. Add share button to expanded activity card
**Modify: `features/activities/cards/activity-feed-expanded/activity.tsx`**

Add `Share2` icon button next to the session title (same pattern as gym-expanded):
```tsx
<AnimatedButton onPress={() => setIsShareModalOpen(true)} hitSlop={10}>
  <Share2 color="#9ca3af" size={20} />
</AnimatedButton>
```

Render `ActivityShareModal` at the bottom of the component.

### 12. Add translations
**Modify: `locales/en/activities.json`** — add `activities.share` section:
```json
"share": {
  "activityFinished": "Activity Finished",
  "shareActivity": "Share Activity",
  "share": "Share",
  "sharing": "Sharing...",
  "done": "Done",
  "close": "Close",
  "shareError": "Failed to share activity",
  "duration": "Duration",
  "calories": "Calories",
  "distance": "Distance",
  "avgPace": "Avg Pace",
  "avgSpeed": "Avg Speed",
  "movingTime": "Moving Time",
  "steps": "Steps",
  "minStats": "Select at least 2 stats",
  "maxStats": "Maximum 6 stats"
}
```

**Modify: `locales/fi/activities.json`** — add `activities.share` section:
```json
"share": {
  "activityFinished": "Aktiviteetti valmis",
  "shareActivity": "Jaa aktiviteetti",
  "share": "Jaa",
  "sharing": "Jaetaan...",
  "done": "Valmis",
  "close": "Sulje",
  "shareError": "Aktiviteetin jakaminen epäonnistui",
  "duration": "Kesto",
  "calories": "Kalorit",
  "distance": "Matka",
  "avgPace": "Ka. vauhti",
  "avgSpeed": "Ka. nopeus",
  "movingTime": "Liikkeessä",
  "steps": "Askeleet",
  "minStats": "Valitse vähintään 2 tilastoa",
  "maxStats": "Enintään 6 tilastoa"
}
```

## Files Summary

| File | Action |
|------|--------|
| `lib/hooks/useShareCard.ts` | Create (move from gym, add filenamePrefix param) |
| `lib/stores/activitySessionSummaryStore.ts` | Create |
| `features/activities/lib/activityShareCardUtils.ts` | Create |
| `features/activities/components/share/ActivityShareCard.tsx` | Create |
| `features/activities/components/share/StatToggleChips.tsx` | Create |
| `features/activities/components/share/useMapSnapshot.ts` | Create |
| `features/activities/components/share/ActivityShareModal.tsx` | Create |
| `app/activities/activity-finished/index.tsx` | Create |
| `features/activities/hooks/useSaveSession.ts` | Modify (store summary, navigate to activity-finished) |
| `app/activities/start-activity/index.tsx` | Modify (pass extra params to save hook) |
| `features/activities/cards/activity-feed-expanded/activity.tsx` | Modify (add share button + modal) |
| `features/gym/components/ShareModal.tsx` | Modify (update useShareCard import path) |
| `app/gym/training-finished/index.tsx` | Modify (update useShareCard import path) |
| `locales/en/activities.json` | Modify (add share translations) |
| `locales/fi/activities.json` | Modify (add share translations) |

## Reusable Code

| What | Source Location |
|------|----------------|
| Share capture + native share sheet | `features/gym/hooks/useShareCard.ts` → move to `lib/hooks/` |
| StatBox UI pattern | `features/gym/components/ShareCard.tsx` (lines 135-142) |
| Scaled preview + transform pattern | `app/gym/training-finished/index.tsx` (lines 22-43) |
| Route GeoJSON + bounds calculation | `features/activities/cards/activity-feed-expanded/components/map.tsx` (lines 44-76) |
| Route smoothing (Chaikin's) | `features/activities/lib/smoothCoordinates.ts` |
| Duration/distance/pace formatting | `lib/formatDate.ts` (`formatDuration`, `formatMeters`, `formatAveragePace`) |
| Store cleanup on navigation | `app/gym/training-finished/index.tsx` (lines 47-52) |

## Verification
1. Complete an activity with GPS → lands on activity-finished page with map + stats card preview
2. Toggle stats on/off → card updates in real-time, minimum 2 enforced
3. Press "Share Activity" → system share sheet opens with 1080×1080 PNG
4. Complete an activity without GPS → card shows stats only (no map), still shareable
5. Open an old activity from feed → expanded card → Share2 button → modal with map + toggleable stats → share works
6. Verify gym share card still works after `useShareCard` move
7. Test both English and Finnish translations
