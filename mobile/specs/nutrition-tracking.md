# Nutrition Tracking

## Overview
Full nutrition/calorie tracking feature with barcode scanning, food search, custom foods, favorites for fast tracking, custom meal types, and daily macro goals.

## Key Decisions
- **Feature name**: "Nutrition" in all UI and navigation
- **Food caching**: Shared `foods` table — any user's barcode scan benefits all users
- **Meal types**: 4 defaults (breakfast, lunch, dinner, snack) + user-created custom types
- **Platform**: Mobile only (barcode scanning is mobile-only)
- **External API**: Open Food Facts (free, open-source, no API key needed)
- **Custom foods**: Private per user (user-scoped `custom_foods` table)

## Data Flow: Barcode Scan
1. User scans barcode with camera
2. Check our `foods` table by barcode
3. If miss → fetch from Open Food Facts API
4. Cache result in `foods` table → future scans by any user are instant
5. Show food details → user picks serving size + meal type → log it

## Data Flow: Food Search
1. User types food name (300ms debounce)
2. Parallel search: local `foods` + `custom_foods` tables + Open Food Facts API
3. Local results shown first, then API results (de-duplicated by barcode)
4. API results cached only when user selects/logs one

---

## Database Schema

### Table: `foods` (shared food cache)
Shared across all users. Populated from Open Food Facts API when users scan barcodes or select search results.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `DEFAULT gen_random_uuid()` |
| barcode | TEXT UNIQUE | EAN/UPC barcode, nullable for text-searched foods |
| name | TEXT NOT NULL | Product name |
| brand | TEXT | Brand name |
| serving_size_g | NUMERIC(8,2) | Default serving in grams, default 100 |
| serving_description | TEXT | e.g. "1 slice (30g)", "1 cup (240ml)" |
| calories_per_100g | NUMERIC(7,2) | kcal per 100g |
| protein_per_100g | NUMERIC(7,2) | grams per 100g |
| carbs_per_100g | NUMERIC(7,2) | grams per 100g |
| fat_per_100g | NUMERIC(7,2) | grams per 100g |
| fiber_per_100g | NUMERIC(7,2) | grams per 100g |
| sugar_per_100g | NUMERIC(7,2) | grams per 100g |
| sodium_per_100g | NUMERIC(7,2) | grams per 100g |
| source | TEXT | `'openfoodfacts'` or `'manual'`, default `'openfoodfacts'` |
| image_url | TEXT | Product image URL from API |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |

**RLS**: Any authenticated user can SELECT and INSERT (shared cache). No UPDATE/DELETE by regular users.

**Index**: `idx_foods_barcode` UNIQUE WHERE barcode IS NOT NULL

### Table: `custom_foods` (user-private)
Same nutrition columns as `foods`, but scoped to a single user.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `DEFAULT gen_random_uuid()` |
| user_id | UUID NOT NULL | `DEFAULT auth.uid()` |
| name | TEXT NOT NULL | |
| brand | TEXT | |
| serving_size_g | NUMERIC(8,2) | Default 100 |
| serving_description | TEXT | |
| calories_per_100g | NUMERIC(7,2) | |
| protein_per_100g | NUMERIC(7,2) | |
| carbs_per_100g | NUMERIC(7,2) | |
| fat_per_100g | NUMERIC(7,2) | |
| fiber_per_100g | NUMERIC(7,2) | |
| sugar_per_100g | NUMERIC(7,2) | |
| sodium_per_100g | NUMERIC(7,2) | |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |

**RLS**: User can only CRUD own rows (`user_id = auth.uid()`)

### Table: `food_logs` (daily food entries)
Each row is one food item logged to a meal. Nutrition values are denormalized at log time so edits to the food don't change history.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `DEFAULT gen_random_uuid()` |
| user_id | UUID NOT NULL | `DEFAULT auth.uid()` |
| food_id | UUID | FK → `foods(id)`, nullable |
| custom_food_id | UUID | FK → `custom_foods(id)`, nullable |
| meal_type | TEXT NOT NULL | Free text. Default `'snack'`. Supports custom meal types |
| serving_size_g | NUMERIC(8,2) NOT NULL | Actual grams consumed |
| quantity | NUMERIC(6,2) NOT NULL | Number of servings, default 1 |
| calories | NUMERIC(7,2) NOT NULL | Computed at log time |
| protein | NUMERIC(7,2) | |
| carbs | NUMERIC(7,2) | |
| fat | NUMERIC(7,2) | |
| logged_at | DATE NOT NULL | Local date from client (not CURRENT_DATE) |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |

**Constraints**:
- CHECK: exactly one of `food_id` or `custom_food_id` must be set
- No CHECK on `meal_type` — free text to support custom meal types

**Index**: `(user_id, logged_at DESC)`

**RLS**: User can only CRUD own rows

### Table: `nutrition_goals` (user targets)

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK | `DEFAULT auth.uid()` |
| calorie_goal | NUMERIC(7,0) | Default 2000 |
| protein_goal | NUMERIC(7,1) | Nullable = not tracking this macro |
| carbs_goal | NUMERIC(7,1) | |
| fat_goal | NUMERIC(7,1) | |
| custom_meal_types | TEXT[] | Default `'{}'`. User's custom meal type names |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |
| updated_at | TIMESTAMPTZ | |

**RLS**: User owns row

### Table: `favorite_foods` (junction table)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `DEFAULT gen_random_uuid()` |
| user_id | UUID NOT NULL | `DEFAULT auth.uid()` |
| food_id | UUID | FK → `foods(id)`, nullable |
| custom_food_id | UUID | FK → `custom_foods(id)`, nullable |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |

**Constraints**:
- CHECK: exactly one of `food_id` or `custom_food_id` must be set
- UNIQUE on `(user_id, food_id)` and `(user_id, custom_food_id)`

**RLS**: User owns rows

---

## Custom Meal Types

- `meal_type` in `food_logs` is free TEXT (no CHECK constraint)
- 4 built-in defaults always shown: breakfast, lunch, dinner, snack
- Custom types stored in `nutrition_goals.custom_meal_types TEXT[]`
- Display order: defaults first (breakfast → lunch → dinner → snack), then custom in array order
- Users manage custom types from the goals/settings page

---

## RPC Functions

### `nutrition_log_food`
Insert a food log entry, aggregate daily totals, and upsert the feed_item for that day.

**Parameters**: `p_food_name TEXT, p_food_id UUID, p_custom_food_id UUID, p_meal_type TEXT, p_serving_size_g NUMERIC, p_quantity NUMERIC, p_calories NUMERIC, p_protein NUMERIC, p_carbs NUMERIC, p_fat NUMERIC, p_logged_at DATE, p_notes TEXT`

**Returns**: UUID (log entry id)

**Logic**:
1. INSERT into `food_logs`
2. Aggregate daily totals: `SUM(calories)`, `SUM(protein)`, `SUM(carbs)`, `SUM(fat)`, `COUNT(*)`
3. Get user's `calorie_goal` from `nutrition_goals`
4. UPSERT `feed_items` for that day (type `'nutrition'`) with `extra_fields` containing totals + goal

Same daily-upsert pattern as `refresh_habit_feed`.

### `nutrition_delete_food_log`
Delete a food log entry and refresh the daily feed item.

**Parameters**: `p_log_id UUID, p_logged_at DATE`

**Logic**:
1. DELETE from `food_logs` WHERE id = p_log_id AND user_id = auth.uid()
2. Re-aggregate daily totals
3. If no logs remain → delete feed_item for that day
4. Otherwise → update feed_item with new totals

### `nutrition_get_daily_logs`
Get all food logs for a specific date, with joined food name/brand.

**Parameters**: `p_date DATE`

**Returns**: TABLE of logs with food_name, brand, meal_type, serving info, macros, is_custom flag

**Ordering**: meal_type priority (breakfast=1, lunch=2, dinner=3, snack=4, custom=5), then created_at

### `nutrition_upsert_food_from_barcode`
Cache a food from Open Food Facts API into the shared `foods` table.

**Parameters**: `p_barcode TEXT, p_name TEXT, p_brand TEXT, p_serving_description TEXT, p_serving_size_g NUMERIC, p_calories_per_100g NUMERIC, p_protein_per_100g NUMERIC, p_carbs_per_100g NUMERIC, p_fat_per_100g NUMERIC, p_fiber_per_100g NUMERIC, p_sugar_per_100g NUMERIC, p_sodium_per_100g NUMERIC, p_image_url TEXT`

**Returns**: UUID (food id)

**Logic**: INSERT ON CONFLICT (barcode) DO NOTHING. If concurrent insert won, SELECT the existing row's id.

### Update `feed_delete_session`
Add `'nutrition'` type handling: delete all food_logs for the date, then delete the feed_item.

---

## Feed Integration

- **Feed type**: `"nutrition"`
- **`extra_fields` JSONB**:
```json
{
  "total_calories": 1850,
  "total_protein": 120,
  "total_carbs": 200,
  "total_fat": 65,
  "entry_count": 8,
  "calorie_goal": 2200
}
```
- One feed_item per day, upserted on each log/delete
- Feed card shows: `1850 / 2200 kcal` with compact macro summary
- Expanded view shows full daily breakdown by meal

---

## External API: Open Food Facts

Free, open-source food database. No API key required.

### Barcode Lookup
```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

Key response fields:
- `product.product_name` → name
- `product.brands` → brand
- `product.serving_size` → serving_description
- `product.image_url` → image_url
- `product.nutriments.energy-kcal_100g` → calories_per_100g
- `product.nutriments.proteins_100g` → protein_per_100g
- `product.nutriments.carbohydrates_100g` → carbs_per_100g
- `product.nutriments.fat_100g` → fat_per_100g
- `product.nutriments.fiber_100g` → fiber_per_100g
- `product.nutriments.sugars_100g` → sugar_per_100g
- `product.nutriments.sodium_100g` → sodium_per_100g

### Text Search
```
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1&page_size=20
```

Returns `products[]` array with same fields.

### Requirements
- Add `User-Agent: MyTrack/1.0` header (API etiquette)
- Client-side debounce (300ms) on text search
- 5-second timeout on API calls
- Fallback to manual entry if API is down

---

## Barcode Scanner

Use `expo-camera` CameraView (already installed at v17.0.10). Built-in barcode scanning via `onBarcodeScanned` prop.

### Implementation
- Follow `VideoCameraModal.tsx` pattern: `useCameraPermissions()`, `Modal` wrapper
- Barcode types: `["ean13", "ean8", "upc_a", "upc_e"]` (covers all food products)
- `scannedRef` to prevent duplicate rapid scans
- Haptic feedback on successful scan via `expo-haptics`
- Targeting overlay: centered rectangle outline

### Scan Flow UX
1. User taps "Scan" tab on the log page
2. Camera modal opens full-screen
3. Point at barcode → scans → haptic feedback → close modal
4. Look up food (local DB → API fallback)
5. If found → show FoodDetailSheet with nutrition + serving picker
6. If not found → toast "Not found" with option to create custom food

---

## Pages & Navigation

### `app/nutrition/index.tsx` — Daily Summary
- Date picker at top (default: today)
- `DailySummary` component: calorie ring + macro progress bars
- Meal sections: breakfast, lunch, dinner, snack, [custom types]
- Each section lists `FoodLogItem` rows (food name, serving info, calories)
- Swipe-to-delete on food log items
- FAB (+) to navigate to `/nutrition/log`
- Settings/goal icon in header → `/nutrition/goals`

### `app/nutrition/log/index.tsx` — Add Food
Tabbed interface:
- **Search** (default) — Text input with debounced search, results from local DB + API
- **Scan** — Opens `BarcodeScannerModal`
- **Favorites** — List of favorited foods
- **Recent** — Last 20 distinct foods the user has logged

Tapping a food opens `FoodDetailSheet` (bottom sheet) with:
- Food name, brand, nutrition info per 100g
- Serving size picker (grams input or predefined serving)
- Quantity multiplier
- Meal type selector (defaults + custom types)
- Favorite toggle (heart icon)
- "Log" button

### `app/nutrition/goals/index.tsx` — Goals & Settings
- Calorie goal input (daily kcal)
- Optional macro goals: protein (g), carbs (g), fat (g)
- Custom meal types management: add/remove/reorder

### Sessions Hub
Add to `DEFAULT_ITEMS` in `app/sessions/index.tsx`:
- id: `"nutrition"`
- icon: `Utensils` from lucide-react-native
- href: `"/nutrition"`
- color: orange `#f97316`

---

## File Structure

```
app/nutrition/
  index.tsx                       # Daily summary
  log/index.tsx                   # Add food (search/scan/favorites/recent)
  goals/index.tsx                 # Set goals + manage custom meal types

database/nutrition/
  log-food.ts                     # → nutrition_log_food RPC
  delete-food-log.ts              # → nutrition_delete_food_log RPC
  get-daily-logs.ts               # → nutrition_get_daily_logs RPC
  get-nutrition-goals.ts          # → reads nutrition_goals table
  save-nutrition-goals.ts         # → upserts nutrition_goals
  search-foods.ts                 # → ILIKE search on foods + custom_foods
  lookup-barcode.ts               # → check foods by barcode, fallback to API
  cache-food.ts                   # → nutrition_upsert_food_from_barcode RPC
  get-favorites.ts                # → reads favorite_foods with food join
  toggle-favorite.ts              # → insert/delete favorite
  get-recent-foods.ts             # → distinct recent foods from food_logs
  save-custom-food.ts             # → insert into custom_foods

features/nutrition/
  cards/
    nutrition-feed.tsx            # Feed card (BaseFeedCard)
    nutrition-expanded.tsx        # FullScreenModal expanded view
  components/
    DailySummary.tsx              # Calorie ring + macro bars
    MealSection.tsx               # Meal group with food items
    FoodLogItem.tsx               # Single food row (swipe to delete)
    CalorieRing.tsx               # Circular progress
    MacroProgressBar.tsx          # Horizontal macro bar
    FoodSearchList.tsx            # Search results
    FoodDetailSheet.tsx           # Bottom sheet: nutrition + serving picker + log
    NutritionInfo.tsx             # Macro breakdown display
    BarcodeScannerModal.tsx       # Camera modal for scanning
    FavoriteFoodsList.tsx         # Favorites tab
    RecentFoodsList.tsx           # Recent tab
    CustomFoodForm.tsx            # Create custom food
    MealTypePicker.tsx            # Defaults + custom meal types
  hooks/
    useLogFood.ts
    useDeleteFoodLog.ts
    useDailyLogs.ts
    useNutritionGoals.ts
    useSaveGoals.ts
    useFoodSearch.ts
    useBarcodeLookup.ts
    useFavorites.ts
    useToggleFavorite.ts
    useRecentFoods.ts
    useCustomFoods.ts
    useSaveCustomFood.ts

lib/
  open-food-facts.ts              # API client + response mapping

locales/en/nutrition.json         # English translations
locales/fi/nutrition.json         # Finnish translations
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/sessions/index.tsx` | Add nutrition to `DEFAULT_ITEMS` |
| `lib/sessionColors.ts` | Add `nutrition` color (orange `#f97316`) |
| `features/feed-cards/FeedCard.tsx` | Add `case "nutrition":` |
| `features/feed-cards/BaseFeedCard.tsx` | Add gradient colors for `"nutrition"` |
| `features/feed/SessionFeed.tsx` | Add expanded view for nutrition |
| `database/feed/deleteSession.ts` | Add `"nutrition"` type (no media) |
| `locales/en/common.json` | Add `sessions.nutrition` |
| `locales/fi/common.json` | Add `sessions.nutrition` ("Ravinto") |
| `locales/en/feed.json` | Add `feed.card.types.nutrition` |
| `locales/fi/feed.json` | Add `feed.card.types.nutrition` |

---

## Implementation Order

1. **Migration** — All tables + RPC functions → `supabase db push`
2. **Core pages** — Daily view, log page, sessions hub integration
3. **API + scanner** — Open Food Facts client, barcode scanner, food search
4. **Feed cards** — Feed card, expanded view, feed integration
5. **QoL** — Favorites, recents, custom foods, goals, custom meal types, progress visualization

---

## Reference Patterns
- `features/habits/cards/habit-feed.tsx` — Daily aggregation feed card
- `features/notes/components/VideoCameraModal.tsx` — Camera modal for barcode scanner
- `database/weight/save-weight.ts` — Database save pattern
- `features/weight/hooks/useSaveWeight.ts` — Hook validation/mutation pattern
