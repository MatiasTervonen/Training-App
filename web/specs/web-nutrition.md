6# Nutrition Tracking — Web App Integration

## Context
The nutrition tracking feature is fully implemented in the mobile app (barcode scanning, USDA/Open Food Facts search, food logging, saved meals, goals, feed cards). All database tables and RPC functions are already deployed. This spec ports the feature to the web app, excluding barcode scanning. The goal is to match the mobile's visual style (dark theme, orange accents, calorie ring, progress bars).

---

## Files Overview

**~45 new files, ~8 modified files, 0 database migrations needed.**

---

## Phase 1: Infrastructure

### 1.1 Types
- **NEW** `web/types/nutrition.ts` — `DailyFoodLog`, `NutritionGoals`, `NutritionSearchResult`, `SavedMeal`, `SavedMealItem`, `NutritionFeedPayload`, etc.
  - Port from mobile types in `mobile/database/nutrition/` and `mobile/features/nutrition/hooks/useFoodSearch.ts`

### 1.2 Database Queries (14 files)
All in `web/database/nutrition/`. Each follows the web pattern: `createClient()` from `@/utils/supabase/client`, `handleError()` from `@/utils/handleError`, `getClaims()` for auth.

| File | RPC/Table | Source |
|------|-----------|--------|
| `get-daily-logs.ts` | `nutrition_get_daily_logs` | mobile/database/nutrition/get-daily-logs.ts |
| `get-nutrition-goals.ts` | `nutrition_goals` table | mobile/database/nutrition/get-nutrition-goals.ts |
| `save-nutrition-goals.ts` | `nutrition_goals` upsert | mobile/database/nutrition/save-nutrition-goals.ts |
| `log-food.ts` | `nutrition_log_food` | mobile/database/nutrition/log-food.ts |
| `delete-food-log.ts` | `nutrition_delete_food_log` | mobile/database/nutrition/delete-food-log.ts |
| `search-foods.ts` | `foods` + `custom_foods` ilike | mobile/database/nutrition/search-foods.ts |
| `get-favorites.ts` | `favorite_foods` + joins | mobile/database/nutrition/get-favorites.ts |
| `get-recent-foods.ts` | `food_logs` + joins | mobile/database/nutrition/get-recent-foods.ts |
| `toggle-favorite.ts` | `nutrition_toggle_favorite` | mobile/database/nutrition/toggle-favorite.ts |
| `get-saved-meals.ts` | `nutrition_get_saved_meals` | mobile/database/nutrition/get-saved-meals.ts |
| `save-meal.ts` | `nutrition_save_meal` | mobile/database/nutrition/save-meal.ts |
| `log-saved-meal.ts` | `nutrition_log_saved_meal` | mobile/database/nutrition/log-saved-meal.ts |
| `delete-saved-meal.ts` | `nutrition_delete_saved_meal` | mobile/database/nutrition/delete-saved-meal.ts |
| `save-shared-food.ts` | `nutrition_upsert_food_from_barcode` | mobile/database/nutrition/save-shared-food.ts |
| `save-custom-food.ts` | `custom_foods` insert | mobile/database/nutrition/save-custom-food.ts (no image upload) |

### 1.3 API Libraries
- **NEW** `web/lib/open-food-facts.ts` — Copy from `mobile/lib/open-food-facts.ts` (pure fetch, no mobile deps)
- **NEW** `web/lib/usda-food-data.ts` — Copy from `mobile/lib/usda-food-data.ts`, change `EXPO_PUBLIC_USDA_API_KEY` → `NEXT_PUBLIC_USDA_API_KEY`

### 1.4 Translations
- **NEW** `web/app/lib/i18n/locales/en/nutrition.json` — Copy from `mobile/locales/en/nutrition.json`
- **NEW** `web/app/lib/i18n/locales/fi/nutrition.json` — Copy from `mobile/locales/fi/nutrition.json`
- **MODIFY** `web/app/lib/i18n/locales/en/index.ts` — Add nutrition export
- **MODIFY** `web/app/lib/i18n/locales/fi/index.ts` — Add nutrition export
- **MODIFY** EN/FI `common.json` — Add `sessions.nutrition`
- **MODIFY** EN/FI `feed.json` — Add `feed.card.types.nutrition`

### 1.5 CSS
- **MODIFY** `web/app/globals.css` — Add `.card-nutrition` (orange gradient) and `.link-nutrition` classes

---

## Phase 2: Core UI Components

All in `web/features/nutrition/components/`. Port from `mobile/features/nutrition/components/` with these adaptations:
- `View` → `div`, `ScrollView` → native scrolling
- `AppText` → `<p>/<span>` (no bold), `BodyText` → `<span className="font-body">`
- `react-native-svg` → standard HTML `<svg>` + `<circle>`
- `AnimatedButton` → `<button>` with hover effects
- `lucide-react-native` → `lucide-react`

| Component | Description | Mobile Source |
|-----------|-------------|---------------|
| `CalorieRing.tsx` | SVG circular progress ring | CalorieRing.tsx |
| `MacroProgressBar.tsx` | Linear progress bar | MacroProgressBar.tsx |
| `DailySummary.tsx` | Composes CalorieRing + MacroProgressBars | DailySummary.tsx |
| `NutritionInfo.tsx` | Nutrition facts card | NutritionInfo.tsx |
| `MealSection.tsx` | Meal type group header + items | MealSection.tsx |
| `FoodLogItem.tsx` | Single food entry row | FoodLogItem.tsx |
| `MealTypePicker.tsx` | Grid of meal type buttons | MealTypePicker.tsx |

---

## Phase 3: Hooks

All in `web/features/nutrition/hooks/`.

**Query hooks** (useQuery pattern):
- `useDailyLogs.ts` — queryKey: `["dailyLogs", date]`
- `useNutritionGoals.ts` — queryKey: `["nutritionGoals"]`
- `useFavorites.ts` — queryKey: `["nutritionFavorites"]`
- `useRecentFoods.ts` — queryKey: `["recentFoods"]`
- `useSavedMeals.ts` — queryKey: `["savedMeals"]`
- `useFoodSearch.ts` — Parallel search (local + OFF + USDA), 500ms debounce via `use-debounce` (already installed), deduplication by barcode

**Mutation hooks** (invalidate relevant queries, use `react-hot-toast` for feedback):
- `useLogFood.ts` — invalidates dailyLogs + feed + recentFoods
- `useDeleteFoodLog.ts` — invalidates dailyLogs + feed
- `useToggleFavorite.ts` — invalidates nutritionFavorites
- `useSaveGoals.ts` — invalidates nutritionGoals
- `useSaveCustomFood.ts` — invalidates recentFoods (no image upload)
- `useSaveMeal.ts` — invalidates savedMeals
- `useLogSavedMeal.ts` — invalidates dailyLogs + feed
- `useDeleteSavedMeal.ts` — invalidates savedMeals

---

## Phase 4: Search & Logging Components

| Component | Adaptation | Source |
|-----------|-----------|--------|
| `FoodSearchList.tsx` | `FlatList` → `div` + `.map()` | mobile FoodSearchList.tsx |
| `FavoriteFoodsList.tsx` | Same FlatList → div | mobile FavoriteFoodsList.tsx |
| `RecentFoodsList.tsx` | Same | mobile RecentFoodsList.tsx |
| `FoodDetailModal.tsx` | Bottom sheet → `Modal` (`@/components/modal`), inputs use `CustomInput` (`@/ui/CustomInput`) | mobile FoodDetailSheet.tsx |
| `CustomFoodForm.tsx` | Remove barcode/image picker, use `CustomInput` | mobile CustomFoodForm.tsx |

---

## Phase 5: Saved Meals Components

| Component | Adaptation | Source |
|-----------|-----------|--------|
| `SavedMealsList.tsx` | FlatList → div + map | mobile SavedMealsList.tsx |
| `CreateEditMealModal.tsx` | FullScreenModal → Modal, no barcode tab in nested search | mobile CreateEditMealModal.tsx |
| `LogSavedMealModal.tsx` | Bottom sheet → Modal | mobile LogSavedMealSheet.tsx |

---

## Phase 6: Pages

### Main Dashboard — `web/app/(app)/nutrition/page.tsx`
- Date navigation (ChevronLeft/ChevronRight)
- Settings icon → link to `/nutrition/goals`
- DailySummary component
- MealSections grouped by type
- FoodDetailModal for viewing logged items
- FAB → link to `/nutrition/log?date={date}`
- Source: `mobile/app/nutrition/index.tsx`

### Log Food — `web/app/(app)/nutrition/log/page.tsx`
- 5 tabs: Search, Favorites, Recent, Custom, Meals (no Scan tab)
- Tab bar: row of buttons with orange active state
- Search tab: `CustomInput` + `FoodSearchList`
- FoodDetailModal for logging selected food
- Gets `date` from `useSearchParams()`
- Source: `mobile/app/nutrition/log/index.tsx`

### Goals — `web/app/(app)/nutrition/goals/page.tsx`
- Calorie/protein/carbs/fat goal inputs
- Optional nutrient toggles (fiber, sugar, sodium, saturated fat) with conditional goal inputs
- Custom meal types list with add/remove
- Save button (btn-save)
- Source: `mobile/app/nutrition/goals/index.tsx`

---

## Phase 7: Feed Integration & Navigation

### Feed Cards
- **NEW** `web/features/nutrition/cards/nutrition-feed.tsx` — Uses `BaseFeedCard`, shows calories/goal + P/C/F + entry count
- **NEW** `web/features/nutrition/cards/nutrition-expanded.tsx` — Full DailySummary + MealSections in modal

### Existing File Modifications
- **MODIFY** `web/features/feed-cards/FeedCard.tsx` — Add `case "nutrition"` with `NutritionCard`
- **MODIFY** `web/features/feed-cards/BaseFeedCard.tsx` — Add `case "nutrition": return "card-nutrition"` in `getCardGradientClass`
- **MODIFY** `web/features/dashboard/components/sessionFeed.tsx` — Add nutrition expanded view case (simple — just renders `<NutritionExpanded item={expandedItem} />`)
- **MODIFY** `web/app/(app)/sessions/page.tsx` — Add `<LinkButton href="/nutrition" className="link-nutrition">` with `Utensils` icon

---

## Key Adaptation Patterns

| Mobile | Web |
|--------|-----|
| `View` | `div` |
| `FlatList` | `div` + `.map()` |
| `TextInput` | `CustomInput` from `@/ui/CustomInput` |
| `FullScreenModal` / bottom sheet | `Modal` from `@/components/modal` |
| `Toast.show` | `toast.success/error` from `react-hot-toast` |
| `useLocalSearchParams` | `useSearchParams` from `next/navigation` |
| `router.back()` | `router.push("/nutrition")` |
| `Alert.alert` | `window.confirm()` |
| `react-native-svg` | HTML `<svg>` + `<circle>` |
| `lucide-react-native` | `lucide-react` |
| `ActivityIndicator` | `Spinner` from `@/components/spinner` |
| `EXPO_PUBLIC_USDA_API_KEY` | `NEXT_PUBLIC_USDA_API_KEY` |
| `supabase` global | `createClient()` from `@/utils/supabase/client` |
| `getUser()` | `getClaims()` with `data.claims.sub` |

---

## Implementation Order

1. Types → 2. Database queries → 3. API libs → 4. Translations + CSS → 5. Core components (CalorieRing, MacroProgressBar, DailySummary, etc.) → 6. Hooks → 7. Search/list components → 8. FoodDetailModal → 9. CustomFoodForm → 10. Saved meals components → 11. Main page → 12. Log page → 13. Goals page → 14. Feed cards → 15. Feed/navigation integration

---

## Prerequisites
- `NEXT_PUBLIC_USDA_API_KEY` env var must be set (same key as mobile's `EXPO_PUBLIC_USDA_API_KEY`)
- `use-debounce` already installed in web
- No new database migrations needed

## Verification
1. Navigate to Sessions hub → Nutrition link appears with orange gradient
2. Open `/nutrition` → shows date nav, empty state, FAB
3. Click FAB → `/nutrition/log` → 5 tabs work, search returns USDA/OFF results
4. Log a food → appears in dashboard, meal section groups correctly
5. Set goals at `/nutrition/goals` → calorie ring and progress bars reflect goals
6. Create saved meal → log it → all items appear
7. Feed card shows in main dashboard with correct gradient and expand works
