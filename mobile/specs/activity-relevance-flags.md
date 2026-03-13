# Activity Relevance Flags

## Context

The activity tracking feature currently shows the same toggles (GPS, steps) and stats (calories, steps, pace, distance, speed, heading, altitude) for every activity type. This leads to nonsensical UX — for example, a user can start yoga with GPS tracking on and see meaningless pace/speed stats, or start driving and see step counts and calorie burns.

We need per-activity flags that control which toggles and stats are shown, so the UI adapts to the selected activity type.

## Design Decision

Add three boolean columns to the `activities` table:

| Column | Controls | Example: true | Example: false |
|--------|----------|---------------|----------------|
| `is_gps_relevant` | GPS toggle visibility on start screen + all GPS stats (pace, distance, speed, heading, altitude) | Running, Cycling (outdoor), Hiking, Driving | Yoga, Weight training, Cycling (indoor), Swimming, Meditation |
| `is_step_relevant` | Step count display in live stats (no toggle — steps permission is a one-time grant, not per-session) | Running, Walking, Hiking | Cycling, Yoga, Swimming, Driving |
| `is_calories_relevant` | Calorie display in live stats + calorie calculation | Running, Walking, Yoga, Cycling, Swimming | Driving, Meditation |

### Activity Examples

| Activity | GPS | Steps | Calories |
|----------|-----|-------|----------|
| Running | true | true | true |
| Walking | true | true | true |
| Hiking | true | true | true |
| Cycling (outdoor) | true | false | true |
| Cycling (indoor) | false | false | true |
| Yoga | false | false | true |
| Weight training | false | false | true |
| Swimming | false | false | true |
| Driving | true | false | false |
| Meditation | false | false | false |
| Rowing (outdoor) | true | false | true |
| Rowing (indoor) | false | false | true |

Indoor/outdoor variants of the same activity (cycling, rowing, etc.) are stored as separate activity rows in the database with different flag combinations.

### What the Flags Control

**`is_gps_relevant = false`:**
- GPS toggle is **hidden** on the start-activity screen
- GPS tracking never starts → no GPS data collected
- Live stats show the non-GPS layout (large timer + steps/calories only)
- Session saves without GPS track points, distance, pace, speed

**`is_step_relevant = false`:**
- Steps row **hidden** in live stats (both GPS and non-GPS layouts)
- Step-based distance not computed
- Note: The steps toggle on the start screen is a **one-time permission grant** (shown once during onboarding or first use, then never again). It is NOT controlled by this flag. Steps may still be tracked in the background — this flag only controls whether the count is **displayed** in the UI.

**`is_calories_relevant = false`:**
- Calories row hidden in live stats (both GPS and non-GPS layouts)
- `baseMet` is still stored on the activity (no schema change needed), but the UI doesn't display calorie calculations

The flags control **UI visibility only**. Data collection follows naturally — if GPS toggle is hidden, GPS is never enabled, so no GPS data exists. The save-session flow doesn't need changes; it just saves whatever was tracked.

---

## Current State

### Start Activity Screen
- **File:** `app/activities/start-activity/index.tsx`
- GPS toggle always visible (unless `gpsEnabledGlobally` is false)
- Steps toggle always visible (when device has step sensor)
- Both toggles can be enabled for any activity type

### Live Stats Display
- **File:** `features/activities/components/sessionStats.tsx`
- GPS mode: shows timer, steps, calories, pace, distance, speed, heading, altitude
- Non-GPS mode: shows timer, steps, calories
- Steps shown if `stepsAllowed` is true
- Calories always shown

### Activity Creation
- **File:** `app/activities/add-activity/index.tsx`
- Fields: name, base MET, category
- No relevance flag controls

### Activity Editing
- **File:** `app/activities/edit-activity/index.tsx`
- Fields: name, base MET, category
- No relevance flag controls

### Database
- **Table:** `activities` — has `name`, `slug`, `category_id`, `base_met`, `is_active`, `user_id`
- No relevance columns exist

---

## Changes Required

### 1. Database Migration — Add Relevance Columns

**Create:** `supabase/migrations/YYYYMMDDHHmmss_add_activity_relevance_flags.sql`

```sql
ALTER TABLE activities
  ADD COLUMN is_gps_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_step_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_calories_relevant BOOLEAN NOT NULL DEFAULT true;
```

Default `true` so all existing activities keep current behavior. Users can then edit specific activities to set flags appropriately.

### 2. Regenerate Database Types

After `supabase db push`, regenerate types so `database.types.ts` includes the new columns. The `activities` Row type will gain:

```typescript
is_gps_relevant: boolean
is_step_relevant: boolean
is_calories_relevant: boolean
```

The `activities_with_category` type (used by `activityDropdown.tsx` and `start-activity/index.tsx`) inherits from the base `activities` type, so the new fields are automatically available.

### 3. Update Add Activity Form

**Modify:** `app/activities/add-activity/index.tsx`

Add three toggles below the existing fields (category, MET value):

```
┌────────────────────────────────────┐
│  Activity Name         [________] │
│  Category              [▼ Select] │
│  MET Value             [________] │
│                                    │
│  ── Tracking Options ──────────── │
│  GPS Tracking           [ON]      │
│  Steps                  [ON]      │
│  Calories               [ON]      │
│                                    │
│        [ Save Activity ]           │
└────────────────────────────────────┘
```

- All three default to `true` (ON)
- User toggles off what's not relevant for this activity
- Pass the three booleans to `addActivity()`

### 4. Update Edit Activity Form

**Modify:** `app/activities/edit-activity/index.tsx`

Add the same three toggles. Pre-populate from the activity's current values.

### 5. Update `addActivity` Database Function

**Modify:** `database/activities/add-activity.ts`

Add the three flags to the Activity type and insert:

```typescript
type Activity = {
  name: string;
  base_met: number;
  category_id: string;
  is_gps_relevant: boolean;
  is_step_relevant: boolean;
  is_calories_relevant: boolean;
};
```

### 6. Update `editActivity` Database Function

**Modify:** `database/activities/edit-activity.ts`

Add the three flags to the update payload.

### 7. Update Start Activity Screen — Conditional GPS Toggle

**Modify:** `app/activities/start-activity/index.tsx`

When the user selects an activity from the dropdown, read the relevance flags alongside `base_met`:

```typescript
// In the onSelect callback:
setIsGpsRelevant(activity.is_gps_relevant);
setIsStepRelevant(activity.is_step_relevant);
setIsCaloriesRelevant(activity.is_calories_relevant);
```

Also persist these in the AsyncStorage draft for session recovery.

**GPS toggle:**
- Only render if `isGpsRelevant` is `true`
- If `isGpsRelevant` is `false`, force `allowGPS = false`

**Steps toggle:**
- No change — the steps toggle is a one-time permission grant, not per-activity. It appears once (onboarding or first use) and then disappears forever. The `is_step_relevant` flag only controls whether the step count is **displayed** during the session, not whether steps are tracked.

### 8. Update Session Stats — Conditional Display

**Modify:** `features/activities/components/sessionStats.tsx`

Accept new props:

```typescript
type Props = {
  // ... existing props
  isStepRelevant: boolean;
  isCaloriesRelevant: boolean;
};
```

- If `isStepRelevant` is `false`: hide the steps row in both GPS and non-GPS layouts
- If `isCaloriesRelevant` is `false`: hide the calories row in both GPS and non-GPS layouts

When **both** steps and calories are hidden and GPS is off (e.g., meditation), the view shows only the large timer — which is the correct UX for timer-only activities.

### 9. Pass Flags to Save Session

**Modify:** `features/activities/hooks/useSaveSession.ts`

No structural changes needed. The flags control what data gets collected during the session:
- If GPS was never enabled → no track points → `distance_meters`, `avg_pace`, `avg_speed` will be null
- If steps were never tracked → `steps = 0`
- Calories are computed server-side from `baseMet` × weight × duration — the RPC still computes this, but the value won't be displayed in contexts where `is_calories_relevant = false`

### 10. Update Activity Dropdown to Pass Flags

**Modify:** `features/activities/components/activityDropdown.tsx`

The `onSelect` callback already receives the full activity object including all columns from the `activities` table. Since `getActivities()` uses `select("*")`, the new columns are automatically included. No code changes needed in the dropdown itself.

### 11. Update Session History / Share Cards (Low Priority)

Places where session stats are displayed after completion should also respect the flags. This means the session needs to store which activity flags were active when it was recorded, OR look up the activity's current flags.

**Recommendation:** Store the flags as part of the session record (or rely on the activity_id → activity lookup). Since flags could change after the session is recorded, storing them on the session is more accurate but adds complexity. For now, looking up the activity's current flags is simpler and sufficient — users rarely change activity configurations after creation.

### 12. Translations

**Modify:** `locales/en/activities.json` and `locales/fi/activities.json`

Add to the add/edit activity sections:

**English:**
```json
"trackingOptions": "Tracking Options",
"gpsTracking": "GPS Tracking",
"stepsTracking": "Steps",
"caloriesTracking": "Calories"
```

**Finnish:**
```json
"trackingOptions": "Seurantavalinnat",
"gpsTracking": "GPS-seuranta",
"stepsTracking": "Askeleet",
"caloriesTracking": "Kalorit"
```

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/YYYYMMDDHHmmss_add_activity_relevance_flags.sql` |
| MODIFY | `mobile/types/database.types.ts` (regenerate) |
| MODIFY | `mobile/app/activities/add-activity/index.tsx` |
| MODIFY | `mobile/app/activities/edit-activity/index.tsx` |
| MODIFY | `mobile/database/activities/add-activity.ts` |
| MODIFY | `mobile/database/activities/edit-activity.ts` |
| MODIFY | `mobile/app/activities/start-activity/index.tsx` |
| MODIFY | `mobile/features/activities/components/sessionStats.tsx` |
| MODIFY | `mobile/locales/en/activities.json` |
| MODIFY | `mobile/locales/fi/activities.json` |

---

## Implementation Order

1. **Database migration** — add the three columns with `DEFAULT true`
2. **Regenerate types** — `database.types.ts`
3. **Add/edit activity forms** — add toggle controls for the three flags
4. **Start activity screen** — conditionally show/hide GPS toggle based on selected activity
5. **Session stats** — conditionally show/hide steps and calories rows
6. **Translations** — add new strings for both languages
7. **Update existing activities** — user manually edits their activities to set correct flags (or we could add a one-time migration that sets sensible defaults based on known slugs)

---

## Edge Cases

- **Activity selected but no flags set yet (new column defaults):** All default to `true` — existing behavior preserved
- **User changes activity mid-setup (before starting):** Flags update immediately when new activity is selected, toggles appear/disappear
- **GPS was manually enabled, then user switches to non-GPS activity:** Force `allowGPS = false` when `is_gps_relevant = false`
- **User switches to non-step activity:** Steps may still be tracked in the background (permission was already granted), but the step count is simply not displayed in the live stats UI
- **All three flags false (e.g., meditation):** Shows only the timer — valid UX for timer-only activities
- **Session recovery from draft:** The draft in AsyncStorage stores the flags alongside `activityId` and `baseMet`, so recovery restores correct toggle visibility
- **Gym sessions:** Not affected — gym has its own tracking flow with phases. The `is_step_relevant` and `is_calories_relevant` flags on the gym activity don't impact the gym session UI.

## Not In Scope

- Automatic flag suggestions based on activity name/category (could be a future enhancement)
- Per-session flag overrides (the activity defines the behavior, not the session)
- Controlling which stats appear in session history cards (future — use same flags from activity lookup)
- `is_pace_relevant` / `is_speed_relevant` distinction (both shown when GPS is on — not worth the complexity)

---

## Impact on Other Specs

### step-based-distance.md
Step-based distance estimation should only be computed when `is_step_relevant = true`. The spec already mentions filtering by step-relevant activities — the `is_step_relevant` flag formalizes this.

### activity-milestone-alerts.md
Milestone alerts for steps/distance/calories should respect the flags:
- Steps milestones only available when `is_step_relevant = true`
- Distance milestones only available when `is_gps_relevant = true`
- Calories milestones only available when `is_calories_relevant = true`
- Duration milestones always available (timer is always shown)

The milestone settings UI should conditionally show/hide metric options based on the selected activity's flags.
