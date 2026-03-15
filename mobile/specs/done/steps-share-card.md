# Steps Chart Share Feature

## Context
The weight analytics page has a share feature that lets users capture a styled 1080x1080 card and share/save it. The steps chart on the activity analytics page lacks this capability. We want to add the same share functionality following the established weight share pattern.

## Architecture
Follow the exact same pattern as weight share: share button in header area, modal with scaled preview, WebView-based chart capture (canvas renderer for PNG export), and the reusable `useShareCard` hook.

**Key differences from weight share:**
- Bar chart (not line chart) with green color scheme (not blue)
- Ranges: "week" | "month" | "3months" (not "week" | "month" | "year")
- Data: `StepRecord[]` + `todaySteps` (not `weight[]`)
- Stats: Total Steps + Daily Average (not Weight Change + Current Weight)
- Gradient: green-to-dark theme (`["#065f46", "#0f172a", "#0f172a"]`)

## Share Card Design (1080x1080)
```
+----------------------------------+
|  [App icon]  AppName             |  <- App branding
|                                  |
|         Daily Steps              |  <- Title
|    Feb 27 - Mar 6, 2026         |  <- Date range
|                                  |
|  +----------------------------+  |
|  |                            |  |
|  |    [STEPS BAR CHART]      |  |  <- 960x620 bar chart
|  |    (green gradient bars)   |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +-----------+ +-------------+   |
|  |Total Steps| |  Daily Avg  |   |  <- StatBoxes
|  |  52,340   | |   7,477     |   |
|  +-----------+ +-------------+   |
+----------------------------------+
```

## Files to Create

### 1. `features/activities/analytics/StepsShareCard.tsx`
- `forwardRef<View, StepsShareCardProps>` for Skia capture
- Fixed 1080x1080px, `collapsable={false}`
- Props: `range`, `data` (StepRecord[]), `todaySteps`, `chartImageUri`
- Computes date range, total steps, daily average from data
- Green `LinearGradient` background
- Two StatBoxes: Total Steps, Daily Average
- Reuses helper functions from StepsChart (date generation, formatting, data aggregation)

### 2. `features/activities/analytics/useStepsChartImage.ts`
- Hook that generates HTML for WebView with echarts canvas renderer
- Bar chart matching StepsChart styling but scaled for 1080px (larger fonts, thicker bars)
- Green gradient bars, transparent background
- Returns PNG data URL via `postMessage`
- Handles 3-month weekly aggregation same as StepsChart

### 3. `features/activities/analytics/StepsShareModal.tsx`
- Same structure as `WeightShareModal.tsx`
- Props: `visible`, `onClose`, `range`, `data`, `todaySteps`
- Uses `useShareCard("steps-")` from `@/lib/hooks/useShareCard`
- Hidden WebView for chart capture
- Scaled preview + Save/Share/Close buttons
- Toast for success/error

## Files to Modify

### 4. `app/activities/analytics/index.tsx`
- Add share button (Share2 icon) next to the title
- Add `isShareModalOpen` state
- Render `StepsShareModal` passing range, data, todaySteps
- Only show share button when `stepsPermitted` is true

### 5. `locales/en/activities.json`
- Add `activities.stepsShare` section with: title, share, sharing, save, saving, saveSuccess, saveError, shareError, close, totalSteps, dailyAvg

### 6. `locales/fi/activities.json`
- Add Finnish translations for same keys

## Reusable Code
| What | Source |
|------|--------|
| Share capture + share sheet + gallery save | `lib/hooks/useShareCard.ts` (as-is) |
| Modal pattern (scale, WebView, buttons) | `features/weight/components/WeightShareModal.tsx` |
| Share card layout (branding, gradient, StatBox) | `features/weight/components/WeightShareCard.tsx` |
| Steps data processing (date ranges, aggregation) | `features/activities/analytics/StepsChart.tsx` |

## Verification
1. Open activity analytics with steps permission granted
2. Tap share icon next to "Activity Analytics" title
3. Modal opens with scaled preview of green-themed steps bar chart
4. Chart matches current range selection (7D/30D/90D)
5. Stats show correct total and daily average
6. "Share" button opens native share sheet with 1080x1080 PNG
7. "Save" button saves to gallery with success toast
8. Buttons disabled during share/save operation
9. Test all 3 ranges
10. Test both EN and FI languages
