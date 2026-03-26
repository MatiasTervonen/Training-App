# Food Data Correction — Feature Spec

## Context
Users scan barcodes and sometimes the per-100g nutritional values from Open Food Facts are wrong (someone entered them incorrectly, or the product was reformulated). Currently users have no way to correct this — they're stuck with bad data or must delete and re-create as a custom food.

This feature lets users:
1. Edit per-100g values in `FoodDetailSheet` before logging (edits only affect their log, not shared data)
2. Optionally report the food as having incorrect data
3. Admins review reports on the web and update the shared `foods` table with verified values

---

## 1. Database Migration

**New file:** `supabase/migrations/20260326HHMMSS_food_reports.sql`

### 1a. `food_reports` table

```sql
CREATE TABLE food_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  reported_calories_per_100g NUMERIC(7,2),
  reported_protein_per_100g NUMERIC(7,2),
  reported_carbs_per_100g NUMERIC(7,2),
  reported_fat_per_100g NUMERIC(7,2),
  reported_saturated_fat_per_100g NUMERIC(7,2),
  reported_sugar_per_100g NUMERIC(7,2),
  reported_fiber_per_100g NUMERIC(7,2),
  reported_sodium_per_100g NUMERIC(7,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_food_reports_status ON food_reports (status, created_at DESC);
```

### 1b. RLS policies

```sql
ALTER TABLE food_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_reports_insert"
  ON food_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "food_reports_select_own"
  ON food_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### 1c. RPC: `nutrition_report_food` (user-facing)

Insert a food report. SECURITY INVOKER.

```sql
DROP FUNCTION IF EXISTS nutrition_report_food;
CREATE FUNCTION nutrition_report_food(
  p_food_id UUID,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO food_reports (
    food_id,
    reported_calories_per_100g, reported_protein_per_100g,
    reported_carbs_per_100g, reported_fat_per_100g,
    reported_saturated_fat_per_100g, reported_sugar_per_100g,
    reported_fiber_per_100g, reported_sodium_per_100g
  ) VALUES (
    p_food_id,
    p_calories_per_100g, p_protein_per_100g,
    p_carbs_per_100g, p_fat_per_100g,
    p_saturated_fat_per_100g, p_sugar_per_100g,
    p_fiber_per_100g, p_sodium_per_100g
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
```

### 1d. RPC: `admin_get_food_reports` (admin-facing)

Paginated list of reports with joined food data. Checks admin role via JWT.

```sql
DROP FUNCTION IF EXISTS admin_get_food_reports;
CREATE FUNCTION admin_get_food_reports(
  p_limit INT DEFAULT 15,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  food_id UUID,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  reported_calories_per_100g NUMERIC,
  reported_protein_per_100g NUMERIC,
  reported_carbs_per_100g NUMERIC,
  reported_fat_per_100g NUMERIC,
  reported_saturated_fat_per_100g NUMERIC,
  reported_sugar_per_100g NUMERIC,
  reported_fiber_per_100g NUMERIC,
  reported_sodium_per_100g NUMERIC,
  food_name TEXT,
  brand TEXT,
  barcode TEXT,
  current_calories_per_100g NUMERIC,
  current_protein_per_100g NUMERIC,
  current_carbs_per_100g NUMERIC,
  current_fat_per_100g NUMERIC,
  current_saturated_fat_per_100g NUMERIC,
  current_sugar_per_100g NUMERIC,
  current_fiber_per_100g NUMERIC,
  current_sodium_per_100g NUMERIC,
  image_url TEXT,
  nutrition_label_url TEXT,
  user_email TEXT,
  display_name TEXT
)
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
BEGIN
  IF NOT (auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    r.id, r.food_id, r.user_id, r.status, r.created_at,
    r.reported_calories_per_100g, r.reported_protein_per_100g,
    r.reported_carbs_per_100g, r.reported_fat_per_100g,
    r.reported_saturated_fat_per_100g, r.reported_sugar_per_100g,
    r.reported_fiber_per_100g, r.reported_sodium_per_100g,
    f.name AS food_name, f.brand, f.barcode,
    f.calories_per_100g AS current_calories_per_100g,
    f.protein_per_100g AS current_protein_per_100g,
    f.carbs_per_100g AS current_carbs_per_100g,
    f.fat_per_100g AS current_fat_per_100g,
    f.saturated_fat_per_100g AS current_saturated_fat_per_100g,
    f.sugar_per_100g AS current_sugar_per_100g,
    f.fiber_per_100g AS current_fiber_per_100g,
    f.sodium_per_100g AS current_sodium_per_100g,
    f.image_url, f.nutrition_label_url,
    u.email AS user_email, u.display_name
  FROM food_reports r
  JOIN foods f ON f.id = r.food_id
  LEFT JOIN users u ON u.id = r.user_id
  WHERE (p_status IS NULL OR r.status = p_status)
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
```

### 1e. RPC: `admin_resolve_food_report` (admin-facing)

Accept or reject a report. When accepted, updates the shared `foods` table.

```sql
DROP FUNCTION IF EXISTS admin_resolve_food_report;
CREATE FUNCTION admin_resolve_food_report(
  p_report_id UUID,
  p_action TEXT,
  p_calories_per_100g NUMERIC DEFAULT NULL,
  p_protein_per_100g NUMERIC DEFAULT NULL,
  p_carbs_per_100g NUMERIC DEFAULT NULL,
  p_fat_per_100g NUMERIC DEFAULT NULL,
  p_saturated_fat_per_100g NUMERIC DEFAULT NULL,
  p_sugar_per_100g NUMERIC DEFAULT NULL,
  p_fiber_per_100g NUMERIC DEFAULT NULL,
  p_sodium_per_100g NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public
AS $$
DECLARE
  v_food_id UUID;
BEGIN
  IF NOT (auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update report status
  UPDATE food_reports SET status = p_action WHERE id = p_report_id
  RETURNING food_id INTO v_food_id;

  -- If accepted, update the shared foods table
  IF p_action = 'accepted' THEN
    UPDATE foods SET
      calories_per_100g = COALESCE(p_calories_per_100g, calories_per_100g),
      protein_per_100g = COALESCE(p_protein_per_100g, protein_per_100g),
      carbs_per_100g = COALESCE(p_carbs_per_100g, carbs_per_100g),
      fat_per_100g = COALESCE(p_fat_per_100g, fat_per_100g),
      saturated_fat_per_100g = COALESCE(p_saturated_fat_per_100g, saturated_fat_per_100g),
      sugar_per_100g = COALESCE(p_sugar_per_100g, sugar_per_100g),
      fiber_per_100g = COALESCE(p_fiber_per_100g, fiber_per_100g),
      sodium_per_100g = COALESCE(p_sodium_per_100g, sodium_per_100g)
    WHERE id = v_food_id;
  END IF;
END;
$$;
```

### 1f. UPDATE policy on `foods` for admin

```sql
CREATE POLICY "foods_update_admin" ON foods FOR UPDATE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'))
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin'));
```

---

## 2. Mobile — Editable Per-100g Values in FoodDetailSheet

**Modify:** `features/nutrition/components/FoodDetailSheet.tsx`

### 2a. New state variables

Add state for each per-100g value (as strings for input binding), initialized from `food.*_per_100g` in the existing `useEffect` when `food` changes:
- `editedCalories`, `editedProtein`, `editedCarbs`, `editedFat`
- `editedSaturatedFat`, `editedSugar`, `editedFiber`, `editedSodium`
- `reportToggle` (boolean, default false)
- `per100gExpanded` (boolean, default false)

### 2b. Track modifications

Add `useMemo` comparing edited values vs original `food.*_per_100g` to produce `hasModifiedPer100g` boolean.

### 2c. Use edited values in calculations

Change calculation lines to use parsed edited values instead of `food.*_per_100g`:
```ts
const effectiveCalsPer100g = parseFloat(editedCalories) || 0;
const calculatedCalories = effectiveCalsPer100g * scale;
// ... same for protein, carbs, fat, and optional nutrients
```

### 2d. Collapsible per-100g editing section

Add between quantity input and NutritionInfo display:
- `AnimatedButton` header with chevron icon toggling `per100gExpanded`
- When expanded: `AppInput` fields for calories, protein, carbs, fat per 100g
- Below those: optional nutrients (saturated fat, sugar, fiber, sodium) if food has non-null values

### 2e. Report toggle

Conditionally render below the per-100g section when `hasModifiedPer100g && !food.is_custom`:
- Row with `BodyText` label + `Toggle` component (from `@/components/toggle`)
- Label: `t("detail.reportIncorrectData")`

### 2f. Extend onLog callback

Add optional `reportData` to the `onLog` params:
```ts
reportData?: {
  foodId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g: number | null;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  sodiumPer100g: number | null;
};
```

Include `reportData` in `handleLog` when `reportToggle` is on and `food.id` exists.

---

## 3. Mobile — Report Database Function & Logging Flow

### 3a. New file: `database/nutrition/report-food.ts`

```ts
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type ReportFoodParams = {
  foodId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g?: number | null;
  sugarPer100g?: number | null;
  fiberPer100g?: number | null;
  sodiumPer100g?: number | null;
};

export async function reportFood(params: ReportFoodParams): Promise<string> {
  const { data, error } = await supabase.rpc("nutrition_report_food", {
    p_food_id: params.foodId,
    p_calories_per_100g: params.caloriesPer100g,
    p_protein_per_100g: params.proteinPer100g,
    p_carbs_per_100g: params.carbsPer100g,
    p_fat_per_100g: params.fatPer100g,
    p_saturated_fat_per_100g: params.saturatedFatPer100g ?? null,
    p_sugar_per_100g: params.sugarPer100g ?? null,
    p_fiber_per_100g: params.fiberPer100g ?? null,
    p_sodium_per_100g: params.sodiumPer100g ?? null,
  });
  if (error) {
    handleError(error, { context: "reportFood" });
    throw error;
  }
  return data as string;
}
```

### 3b. Modify: `app/nutrition/log/index.tsx`

Extend `handleLog` params type to include optional `reportData`.

After the existing `await handleLogFood(...)` call, add:
```ts
if (params.reportData) {
  try {
    await reportFood(params.reportData);
  } catch {
    // Silent fail — food log already succeeded
  }
}
```

Import `reportFood` from `@/database/nutrition/report-food`.

---

## 4. Mobile — Translations

### `locales/en/nutrition.json` — add to `detail` section:
```json
"editPer100g": "Edit per 100g values",
"reportIncorrectData": "Report incorrect data"
```

### `locales/fi/nutrition.json` — add to `detail` section:
```json
"editPer100g": "Muokkaa per 100g -arvoja",
"reportIncorrectData": "Ilmoita virheelliset tiedot"
```

---

## 5. Web — Admin Database Layer

### 5a. New file: `web/database/admin/get-food-reports.ts`

Server action following `get-feedback.ts` pattern. Calls `admin_get_food_reports` RPC.

Exports `getFoodReports(offset: number, status?: string)` and `FoodReportItem` type with all fields from the RPC return table.

### 5b. New file: `web/database/admin/resolve-food-report.ts`

Server action calling `admin_resolve_food_report` RPC.

Exports `resolveFoodReport({ reportId, action, ...per100gValues })`.

---

## 6. Web — Admin Hook

### New file: `web/features/admin/hooks/useFoodReports.ts`

`useInfiniteQuery` following `useFeedbackFeed.ts` pattern. Returns paginated `FoodReportItem[]`.

---

## 7. Web — Admin Food Reports Page

### 7a. New file: `web/app/(app)/admin/food-reports/page.tsx`

Following the feedback page pattern:

- Status filter buttons: All, Pending, Accepted, Rejected
- Report cards showing:
  - Food name, brand, barcode
  - Side-by-side: current values vs reported values (calories, protein, carbs, fat)
  - Reporter info (display name, date)
  - Product image thumbnail if available
- Expand button opens `Modal` with:
  - Full food details + nutrition label image
  - Editable input fields for each per-100g value, pre-filled with reported values
  - "Accept" button: calls `resolveFoodReport` with `action: "accepted"` + values from inputs
  - "Reject" button: calls `resolveFoodReport` with `action: "rejected"`
  - Invalidate `["admin-food-reports"]` query on success
- Infinite scroll with `IntersectionObserver`

### 7b. Modify: `web/app/(app)/admin/page.tsx`

Add LinkButton:
```tsx
<LinkButton href={"/admin/food-reports"}>
  {t("admin.foodReports.link")}
</LinkButton>
```

---

## 8. Web — Translations

### `web/app/lib/i18n/locales/en/common.json` — add to `admin` section:
```json
"foodReports": {
  "link": "Food Reports",
  "title": "Food Data Reports",
  "empty": "No food reports yet.",
  "details": "Details",
  "currentValues": "Current Values",
  "reportedValues": "Reported Values",
  "accept": "Accept",
  "reject": "Reject",
  "accepted": "Accepted",
  "rejected": "Rejected",
  "pending": "Pending",
  "resolved": "Report resolved",
  "filters": {
    "all": "All",
    "pending": "Pending",
    "accepted": "Accepted",
    "rejected": "Rejected"
  },
  "calories": "Calories/100g",
  "protein": "Protein/100g",
  "carbs": "Carbs/100g",
  "fat": "Fat/100g",
  "saturatedFat": "Sat. fat/100g",
  "sugar": "Sugar/100g",
  "fiber": "Fiber/100g",
  "sodium": "Sodium/100g"
}
```

### `web/app/lib/i18n/locales/fi/common.json` — add to `admin` section:
```json
"foodReports": {
  "link": "Ruokaraportit",
  "title": "Ruokatietojen raportit",
  "empty": "Ei ruokaraportteja vielä.",
  "details": "Tiedot",
  "currentValues": "Nykyiset arvot",
  "reportedValues": "Raportoidut arvot",
  "accept": "Hyväksy",
  "reject": "Hylkää",
  "accepted": "Hyväksytty",
  "rejected": "Hylätty",
  "pending": "Odottaa",
  "resolved": "Raportti käsitelty",
  "filters": {
    "all": "Kaikki",
    "pending": "Odottavat",
    "accepted": "Hyväksytyt",
    "rejected": "Hylätyt"
  },
  "calories": "Kalorit/100g",
  "protein": "Proteiini/100g",
  "carbs": "Hiilihydraatit/100g",
  "fat": "Rasva/100g",
  "saturatedFat": "Tyydyttynyt rasva/100g",
  "sugar": "Sokeri/100g",
  "fiber": "Kuitu/100g",
  "sodium": "Natrium/100g"
}
```

---

## Key Design Decisions

1. **User edits are log-local** — edited per-100g values only affect the calculation for that specific `food_logs` entry. The shared `foods` record is never modified by users. This works because `food_logs` already stores denormalized calculated values.

2. **Report is decoupled from logging** — the report is a separate insert after the food log succeeds. If the report fails, the log is still saved. Fire-and-forget.

3. **Admin verifies before accepting** — the user's reported values are stored as a hint/starting point, but the admin can edit them before accepting. Admin should verify against the actual product label online.

4. **Only shared foods can be reported** — custom foods are user-private, so reporting doesn't apply (`!food.is_custom` check).

5. **Future AI automation** — the admin review flow can later be augmented with an AI agent that auto-looks up correct values and queues them for admin approval.
