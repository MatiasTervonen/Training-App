# Gym Session Share Card

## Context
After completing a gym workout, users land on a minimal "Workout Finished" page (`app/gym/training-finished/index.tsx`) that shows only a confetti image and a "Done" button — no session data. We want users to be able to share a styled summary card of their workout to social platforms (X, Instagram, WhatsApp, etc.). This is a viral growth driver and a commonly expected feature in fitness apps.

## Approach
- Generate a styled 1080x1080 image on demand when the user taps "Share"
- Use `@shopify/react-native-skia` (already installed at v2.2.12) `makeImageFromView` to capture a React Native view as an image
- Use `expo-sharing` (needs install) to open the system share sheet
- Store session summary in a Zustand store so the training-finished page can display it
- Match the app's existing dark theme with blue gradients

## Share Card Design

```
┌─────────────────────────────────┐
│  [Dumbbell icon]  MyTrack       │  ← App branding
│                                 │
│       Chest & Triceps           │  ← Session title
│         Mar 3                   │  ← Date
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │  52 min  │  │ 12.5t kg│      │  ← Duration / Total Volume
│  │ Duration │  │ Volume  │      │
│  └─────────┘  └─────────┘      │
│  ┌─────────┐  ┌─────────┐      │
│  │    4     │  │   16    │      │  ← Exercise count / Total sets
│  │Exercises │  │  Sets   │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  Bench Press     100 kg × 8     │  ← Top exercises (best set)
│  Incline DB       36 kg × 10   │
│  Cable Fly        20 kg × 12   │
│                                 │
│            MyTrack              │  ← Footer watermark
└─────────────────────────────────┘
```

Stat cards use the same styling as `StatCard` component: `border-blue-500 border rounded-lg bg-slate-950/50`. Background is `LinearGradient` with `["#1e3a8a", "#0f172a", "#0f172a"]` matching the gym expanded card.

## Implementation Steps

### 1. Install `expo-sharing`
```
pnpm add expo-sharing
```

### 2. Create session summary Zustand store
**New file: `lib/stores/sessionSummaryStore.ts`**

Non-persisted store (ephemeral data, only needed between save and the finished page):
- `summary: SessionSummary | null`
- `setSummary(summary)`
- `clearSummary()`

`SessionSummary` type:
```ts
{
  title: string
  date: string          // ISO string
  duration: number      // seconds
  exercises: ExerciseEntry[]  // reuse existing type from types/session.ts
  notes: string
  weightUnit: string    // snapshot from userStore at save time
}
```

### 3. Update `useSaveSession` to populate the store
**Modify: `features/gym/hooks/useSaveSession.ts`**

In the non-editing save path (line ~116-139), after `saveSession()` succeeds and before `router.push("/gym/training-finished")`:
- Read `weightUnit` from `useUserStore.getState().profile?.weight_unit`
- Call `useSessionSummaryStore.getState().setSummary({...})` with `title`, `date: new Date().toISOString()`, `duration: durationInSeconds`, `exercises`, `notes`, `weightUnit`

### 4. Create share card utility functions
**New file: `features/gym/lib/shareCardUtils.ts`**

- `computeShareStats(exercises)` → `{ exerciseCount, totalSets, totalVolume, muscleGroups }`
- `getTopExercises(exercises, limit = 3)` → `TopExercise[]` (name + best set by highest volume = weight × reps)

Same logic as the existing `stats` useMemo in `gym-expanded.tsx` (lines 40-54) — extract and reuse.

### 5. Create the ShareCard component
**New file: `features/gym/components/ShareCard.tsx`**

- `forwardRef<View, ShareCardProps>` — ref is needed for `makeImageFromView`
- Fixed size: `w-[1080px] h-[1080px]` with `collapsable={false}` (required for Android capture)
- Uses `LinearGradient`, `AppText`, lucide icons
- Sections: header (branding), title + date, 2x2 stat grid (Duration, Volume, Exercises, Sets), top exercises list, footer watermark
- Reuses `formatDuration` and `formatDateShort` from `lib/formatDate.ts`

### 6. Create the `useShareCard` hook
**New file: `features/gym/hooks/useShareCard.ts`**

```
cardRef  → useRef<View>  (attach to ShareCard)
isSharing → boolean state
shareCard → async function:
  1. makeImageFromView(cardRef) → SkImage
  2. image.encodeToBase64(ImageFormat.PNG) → base64 string
  3. FileSystem.writeAsStringAsync(cacheDir/filename.png, base64)
  4. Sharing.shareAsync(fileUri, { mimeType: "image/png" })
```

Check `Sharing.isAvailableAsync()` before attempting.

### 7. Update the training-finished page
**Modify: `app/gym/training-finished/index.tsx`**

- Read `summary` from `useSessionSummaryStore`
- Show share card preview (ShareCard scaled down to fit screen using `transform: [{ scale }]` calculated from container width via `onLayout`)
- "Share Workout" button with `Share2` icon → calls `shareCard()`
- "Done" `LinkButton` → navigates to `/dashboard`
- `useEffect` cleanup → `clearSummary()` when navigating away
- If no summary (e.g. app was restarted), show only the Done button (graceful fallback)

### 8. Add share button to expanded gym card
**Modify: `features/gym/cards/gym-expanded.tsx`**

- Add `Share2` icon button in the header area
- On press → open a `Modal` with:
  - Scaled ShareCard preview
  - "Share" button + "Close" button
- Convert `FullGymSession` data to `SessionSummary` format using `useMemo`
- Reuse the same `ShareCard` component and `useShareCard` hook

### 9. Add translations
**Modify: `locales/en/gym.json`** — add `"share"` section:
```json
"share": {
  "workoutFinished": "Workout Finished",
  "shareWorkout": "Share Workout",
  "share": "Share",
  "sharing": "Sharing...",
  "done": "Done",
  "close": "Close",
  "dialogTitle": "Share your workout",
  "shareError": "Failed to share workout",
  "duration": "Duration",
  "volume": "Volume",
  "exercises": "Exercises",
  "sets": "Sets"
}
```

**Modify: `locales/fi/gym.json`** — add `"share"` section:
```json
"share": {
  "workoutFinished": "Treeni valmis",
  "shareWorkout": "Jaa treeni",
  "share": "Jaa",
  "sharing": "Jaetaan...",
  "done": "Valmis",
  "close": "Sulje",
  "dialogTitle": "Jaa treenisi",
  "shareError": "Treenin jakaminen epäonnistui",
  "duration": "Kesto",
  "volume": "Volyymi",
  "exercises": "Liikkeet",
  "sets": "Sarjat"
}
```

## Files Summary

| File | Action |
|------|--------|
| `lib/stores/sessionSummaryStore.ts` | Create |
| `features/gym/lib/shareCardUtils.ts` | Create |
| `features/gym/components/ShareCard.tsx` | Create |
| `features/gym/hooks/useShareCard.ts` | Create |
| `features/gym/hooks/useSaveSession.ts` | Modify (add store population) |
| `app/gym/training-finished/index.tsx` | Modify (add card preview + share) |
| `features/gym/cards/gym-expanded.tsx` | Modify (add share button + modal) |
| `locales/en/gym.json` | Modify (add share translations) |
| `locales/fi/gym.json` | Modify (add share translations) |
| `package.json` | Modify (add expo-sharing) |

## Verification
1. Complete a gym session → training-finished page shows styled share card preview
2. Tap "Share Workout" → system share sheet opens with a 1080x1080 PNG
3. Share to an app (e.g. X, WhatsApp) → image looks correct with all stats
4. Tap "Done" → navigates to dashboard, summary store is cleared
5. Open an old gym session from feed → expanded card → tap share icon → modal with card preview → share works
6. Test with no session data (direct URL navigation) → graceful fallback, no crash
7. Test both English and Finnish translations
