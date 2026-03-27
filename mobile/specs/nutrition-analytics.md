# Nutrition Analytics

## Overview

Analytics page for the nutrition feature showing calorie and macro trends over time, goal adherence stats, macro distribution, and most-logged foods. Accessible from the nutrition daily view via a chart icon in the header.

## Key Decisions

### Why a separate page instead of inline charts?
| Option | Verdict |
|--------|---------|
| Inline charts on daily view | Clutters the primary logging flow, slow initial render |
| Separate analytics page | **Chosen** — keeps daily view focused on logging, charts load only when wanted |

### Time ranges
Three preset ranges matching the activities analytics pattern: **7D**, **30D**, **90D**. No custom date picker — keeps it simple and consistent with the rest of the app.

### Aggregation strategy
| Option | Verdict |
|--------|---------|
| Client-side aggregation (fetch all logs, compute in JS) | Slow for 90 days of data, wastes bandwidth |
| Single RPC with server-side aggregation | **Chosen** — one query returns daily totals + top foods for the full range |

### Charting library
Use **ECharts via `@wuba/react-native-echarts`** — already used in activities analytics and gym analytics. No new dependencies.

---

## Database

### RPC: `nutrition_get_analytics`

Single RPC that returns all data needed for the analytics page in one call.

**Parameters**:
- `p_start_date DATE` — Start of range (inclusive)
- `p_end_date DATE` — End of range (inclusive)

**Returns**: JSON object with two arrays:

```json
{
  "daily_totals": [
    {
      "date": "2026-03-20",
      "calories": 1850,
      "protein": 120.5,
      "carbs": 200.0,
      "fat": 65.3,
      "calorie_goal": 2200
    }
  ],
  "top_foods": [
    {
      "food_name": "Chicken breast",
      "log_count": 12,
      "total_calories": 2400
    }
  ]
}
```

**Logic**:
1. `daily_totals`: `SELECT logged_at, SUM(calories), SUM(protein), SUM(carbs), SUM(fat) FROM food_logs WHERE user_id = auth.uid() AND logged_at BETWEEN p_start_date AND p_end_date GROUP BY logged_at ORDER BY logged_at`
2. Join `nutrition_goals` to attach `calorie_goal` to each row (single value, same for all days — just read once and attach)
3. `top_foods`: `SELECT food_name, COUNT(*) as log_count, SUM(calories) as total_calories FROM food_logs WHERE user_id = auth.uid() AND logged_at BETWEEN p_start_date AND p_end_date GROUP BY food_name ORDER BY log_count DESC LIMIT 5`
4. Return both arrays as a single JSONB result

**Security**: `SECURITY INVOKER`, uses `auth.uid()` — no user ID parameter needed.

---

## Data Flow

1. User taps chart icon on nutrition daily view → navigates to `/nutrition/analytics`
2. Page loads → compute start/end dates for default range (7D)
3. Call `nutrition_get_analytics` RPC with date range
4. Render charts from response: calorie trend, macro trend, summary stats, top foods
5. User taps different range → recompute dates → refetch

---

## Page: `app/nutrition/analytics/index.tsx`

### Layout
Follow the activities analytics pattern: `ScrollView` outside `PageContainer`.

### Sections (top to bottom)

#### 1. Range Selector
Three toggle buttons: **7D**, **30D**, **90D**. Same styling as activities analytics — `bg-slate-800` container, `bg-slate-700` for active, green text for active.

#### 2. Summary Cards
Row of 3-4 stat cards showing period averages:

| Card | Value | Subtitle |
|------|-------|----------|
| Avg Calories | `totalCalories / daysWithData` | "avg kcal/day" |
| Avg Protein | `totalProtein / daysWithData` | "avg protein/day" |
| Days on Target | count of days where `calories <= calorie_goal * 1.05 AND calories >= calorie_goal * 0.8` | "days on target" |
| Logging Streak | consecutive days with at least 1 log ending at today | "day streak" |

"Days on Target" uses a ±20%/+5% band — strict exact-match would discourage users. Streak counts only consecutive days ending today (if today has no logs, streak is 0).

Compute all of these client-side from the `daily_totals` array — no extra RPC needed.

#### 3. Calorie Trend Chart (ECharts Bar)
- X-axis: dates (formatted like StepsChart — weekday short for 7D, date for 30D/90D)
- Y-axis: calories
- Bars: daily calorie total, colored green when within goal band, amber when over
- Goal line: horizontal dashed line at `calorie_goal`
- Missing days shown as 0-height gaps (not interpolated)

#### 4. Macro Trend Chart (ECharts Stacked Bar)
- Same X-axis as calorie chart
- Stacked bars: protein (cyan `#06b6d4`), carbs (orange `#f97316`), fat (rose `#f43f5e`)
- Colors match existing `MacroRing` component colors
- Legend below chart

#### 5. Macro Distribution (ECharts Pie/Donut)
- Period-wide average macro split as percentages
- Donut chart with center text showing total avg calories
- Same 3 colors as macro trend
- Legend: "Protein 30% · Carbs 45% · Fat 25%"

#### 6. Top Foods
- Simple list of top 5 most-logged foods in the period
- Each row: rank number, food name, log count, total calories
- Styled as cards in `bg-slate-800` with `rounded-xl`

### States
- **Loading**: Centered `ActivityIndicator` (green `#22c55e`)
- **Empty**: `BarChart3` icon + "No nutrition data" message + description (same pattern as activities analytics empty state)
- **Charts**: Rendered after `InteractionManager.runAfterInteractions()` to prevent navigation jank

---

## Navigation

### Entry point
Add a chart icon button to the nutrition page header, between the share and settings buttons:

```tsx
<AnimatedButton onPress={() => router.push("/nutrition/analytics")} className="btn-base">
  <BarChart3 size={18} color="#94a3b8" />
</AnimatedButton>
```

In `app/nutrition/index.tsx`, add to the right-side icon row.

---

## Translations

Add keys to `locales/en/nutrition.json` and `locales/fi/nutrition.json`:

```json
{
  "analytics": {
    "title": "Nutrition Analytics",
    "ranges": {
      "week": "7D",
      "month": "30D",
      "threeMonths": "90D"
    },
    "summary": {
      "avgCalories": "avg kcal/day",
      "avgProtein": "avg protein/day",
      "daysOnTarget": "days on target",
      "streak": "day streak"
    },
    "charts": {
      "calories": "Calories",
      "macros": "Macros",
      "distribution": "Macro Distribution",
      "goal": "Goal"
    },
    "topFoods": {
      "title": "Top Foods",
      "times": "times",
      "kcal": "kcal"
    },
    "noData": "No nutrition data",
    "noDataDesc": "Start logging your meals to see trends and insights here."
  }
}
```

Finnish translations with proper ä/ö characters.

---

## File Structure

```
app/nutrition/
  analytics/index.tsx                  # Analytics page

features/nutrition/
  analytics/
    CalorieTrendChart.tsx              # Bar chart — daily calories vs goal
    MacroTrendChart.tsx                # Stacked bar — daily protein/carbs/fat
    MacroDistributionChart.tsx         # Donut — period macro split
    TopFoodsList.tsx                   # Top 5 most-logged foods
    SummaryCards.tsx                   # Avg calories, avg protein, days on target, streak
  hooks/
    useNutritionAnalytics.ts           # React Query hook wrapping the RPC

database/nutrition/
  get-analytics.ts                     # → nutrition_get_analytics RPC call
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/nutrition/index.tsx` | Add `BarChart3` icon button in header linking to `/nutrition/analytics` |
| `locales/en/nutrition.json` | Add `analytics.*` keys |
| `locales/fi/nutrition.json` | Add `analytics.*` keys |

---

## Implementation Order

1. **Migration** — `nutrition_get_analytics` RPC → `supabase db push`
2. **Database layer** — `get-analytics.ts` + `useNutritionAnalytics.ts` hook
3. **Page scaffold** — Route, range selector, loading/empty states
4. **Summary cards** — Avg calories, avg protein, days on target, streak
5. **Charts** — Calorie trend → macro trend → macro distribution
6. **Top foods** — List component
7. **Navigation** — Add chart icon to nutrition header
8. **Translations** — EN + FI

---

## Reference Patterns
- `app/activities/analytics/index.tsx` — Page structure, range selector, loading/empty states
- `features/activities/analytics/StepsChart.tsx` — ECharts bar chart setup, date formatting, SkiaChart usage
- `features/activities/analytics/ActivityBreakdownChart.tsx` — ECharts pie/donut chart
- `features/nutrition/components/DailySummary.tsx` — Macro color scheme (cyan/orange/rose)
- `features/nutrition/components/CalorieRing.tsx` — Goal comparison logic
