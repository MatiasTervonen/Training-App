# Distance Unit Setting

## Context
The app already supports language switching (EN/FI) and weight unit selection (kg/lbs). Distance is currently hardcoded to metric (km, m, km/h, min/km). Users who select "lbs" almost certainly also expect miles. Adding a distance unit setting completes the unit system support.

## Approach
- Add a `distance_unit` column to the `users` table in Supabase (default `"km"`)
- Add `distance_unit` to the user profile store and profile page
- All internal calculations and database storage remain in **meters** — convert only at the display layer
- Update formatting functions to read the user's distance unit preference
- Update all hardcoded unit labels throughout the app

## Unit Systems

| Setting | Distance (short) | Distance (long) | Speed | Pace | Altitude |
|---------|-------------------|------------------|-------|------|----------|
| **km** (Metric) | m | km | km/h | min/km | m |
| **mi** (Imperial) | ft | mi | mph | min/mi | ft |

### Conversion Constants
- 1 km = 0.621371 mi
- 1 m = 3.28084 ft
- 1 m/s = 2.23694 mph
- 1 m/s = 3.6 km/h
- Pace (sec/mi) = Pace (sec/km) * 1.60934

## Implementation Steps

### 1. Supabase Migration
**New migration: `supabase/migrations/YYYYMMDDHHmmss_add_distance_unit.sql`**

```sql
ALTER TABLE users ADD COLUMN distance_unit text NOT NULL DEFAULT 'km';
```

### 2. Update UserProfile type and store
**Modify: `lib/stores/useUserStore.ts`**

Add `distance_unit` to `UserProfile`:
```ts
export interface UserProfile {
  display_name: string;
  weight_unit: string;
  distance_unit: string;  // "km" | "mi"
  profile_picture: string | null;
  role: string;
}
```

### 3. Update profile fetch
**Modify: `database/settings/get-user-profile.ts`**

Add `distance_unit` to the select query:
```ts
.select("id, display_name, weight_unit, distance_unit, profile_picture, role")
```

### 4. Update profile save
**Modify: `database/settings/save-user-profile.ts`**

Add `distance_unit` to the update payload type:
```ts
export async function saveUserProfile(updates: {
  display_name: string;
  weight_unit: string;
  distance_unit: string;
  profile_picture: string | null;
}) {
```

### 5. Update profile page UI
**Modify: `app/menu/profile/index.tsx`**

Add a `SelectInput` for distance unit below the weight unit selector:
```tsx
const [distanceUnit, setDistanceUnit] = useState("");

// In useEffect:
setDistanceUnit(distanceUnitZ || "km");

// In JSX, after the weight unit SelectInput:
<View className="mt-5">
  <SelectInput
    topLabel={t("menu:profile.distanceUnit")}
    label={t("menu:profile.distanceUnit")}
    value={distanceUnit}
    onChange={setDistanceUnit}
    options={[
      { value: "km", label: "km" },
      { value: "mi", label: "mi" },
    ]}
  />
</View>

// In updateSettings payload:
const payload = {
  display_name: userName,
  weight_unit: weightUnit,
  distance_unit: distanceUnit,
  profile_picture: profilePictureUrl,
};
```

### 6. Create distance formatting utilities
**Modify: `lib/formatDate.ts`**

Update `formatMeters` to support both unit systems:
```ts
export const formatMeters = (meters: number) => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";

  if (distanceUnit === "mi") {
    const feet = meters * 3.28084;
    if (feet >= 5280) {
      return `${(meters / 1609.344).toFixed(1)} mi`;
    } else {
      return `${Math.round(feet)} ft`;
    }
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  } else {
    return `${meters.toFixed(1)} m`;
  }
};
```

Add new helper for pace formatting:
```ts
export const formatAveragePace = (paceSecondsPerKm: number) => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";

  let paceSeconds = paceSecondsPerKm;
  if (distanceUnit === "mi") {
    paceSeconds = paceSecondsPerKm * 1.60934;
  }

  if (!isFinite(paceSeconds) || paceSeconds <= 0) return "0:00";

  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
```

Add new helper for speed display:
```ts
export const formatSpeed = (kmh: number) => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";

  if (distanceUnit === "mi") {
    return `${(kmh * 0.621371).toFixed(1)} mph`;
  }
  return `${kmh.toFixed(1)} km/h`;
};

export const formatSpeedFromMs = (ms: number) => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";

  if (distanceUnit === "mi") {
    return Math.round(ms * 2.23694); // mph
  }
  return Math.round(ms * 3.6); // km/h
};

export const formatAltitude = (meters: number) => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";

  if (distanceUnit === "mi") {
    return `${Math.round(meters * 3.28084)} ft`;
  }
  return `${Math.round(meters)} m`;
};
```

Add a unit label helper:
```ts
export const getDistanceUnitLabels = () => {
  const distanceUnit = useUserStore.getState().profile?.distance_unit ?? "km";
  return {
    speed: distanceUnit === "mi" ? "mph" : "km/h",
    pace: distanceUnit === "mi" ? "min/mi" : "min/km",
    altitude: distanceUnit === "mi" ? "ft" : "m",
  };
};
```

### 7. Update live session stats (during activity)
**Modify: `features/activities/components/sessionStats.tsx`**

Replace hardcoded unit labels:

| Line | Current | Change to |
|------|---------|-----------|
| 111 | `{formatAveragePace(averagePacePerKm)} min/km` | `{formatAveragePace(averagePacePerKm)} {labels.pace}` |
| 148 | `{Math.round(lastMovingPoint?.speed * 3.6)}` | `{formatSpeedFromMs(lastMovingPoint.speed)}` |
| 152 | `<AppText>km/h</AppText>` | `<AppText>{labels.speed}</AppText>` |
| 209 | `<AppText>m</AppText>` | `<AppText>{labels.altitude}</AppText>` |
| 200 | `{Math.round(lastMovingPoint.altitude)}` | Use `formatAltitude` value |

Get labels at top of component:
```ts
const labels = getDistanceUnitLabels();
```

### 8. Update expanded activity session stats (feed)
**Modify: `features/activities/cards/activity-feed-expanded/components/sessionStats.tsx`**

Replace hardcoded translation keys:
- Line 52: `minPerKm` label — use `getDistanceUnitLabels().pace`
- Line 56: `kmPerHour` label — use `getDistanceUnitLabels().speed`

`formatMeters` and `formatAveragePace` already handle conversion after step 6.

### 9. Update activity feed card
**Modify: `features/activities/cards/activity-feed.tsx`**

Line 63 uses `formatMeters()` — already handled after step 6. No label changes needed here.

### 10. Update activity share card utils
**Modify: `features/activities/lib/activityShareCardUtils.ts`**

```ts
// Line 42: pace label
value: `${formatAveragePace(summary.averagePace)} ${getDistanceUnitLabels().pace}`,

// Line 51: speed — use formatSpeed
value: formatSpeed(summary.averageSpeed),
```

### 11. Update template history
**Modify: `features/activities/templates/components/TemplateHistoryModal.tsx`**

- Line 136: `formatAveragePace` — already handled
- Line 215: `minPerKm` label — use `getDistanceUnitLabels().pace`

**Modify: `features/activities/templates/cards/template-expanded.tsx`**

- Line 55: `formatMeters` — already handled

**Modify: `features/activities/templates/components/TemplateHistoryChart.tsx`**

- Line 59: `formatAveragePace` — already handled (chart tooltip)

### 12. Update reports
**Modify: `features/reports/components/ReportSection.tsx`**

- Line 120-121: `formatMeters` — already handled after step 6

**Modify: `features/reports/components/ReportShareCard.tsx`**

- Line 68: `formatMeters` — already handled after step 6

### 13. Add translations
**Modify: `locales/en/menu.json`** — add to `profile` section:
```json
"distanceUnit": "Distance Unit"
```

**Modify: `locales/fi/menu.json`** — add to `profile` section:
```json
"distanceUnit": "Matkayksikkö"
```

**Modify: `locales/en/activities.json`** — update `sessionStats` section:
```json
"minPerKm": "min/km",
"minPerMi": "min/mi",
"kmPerHour": "km/h",
"mph": "mph"
```

**Modify: `locales/fi/activities.json`** — same keys (unit labels are universal).

### 14. Update onboarding (if distance unit is collected there)
Currently onboarding collects weight unit. Optionally add distance unit to the same step — or default to `"km"` and let users change in profile. Defaulting is simpler and avoids adding complexity to onboarding.

**Recommendation:** Default to `"km"`, no onboarding change needed.

## What Does NOT Change
- `haversine()` in `countDistance.ts` — always returns meters
- `useDistanceFromTrack()` — always returns meters internally
- `useAveragePace()` — always returns seconds/km internally
- Database columns (`distance_meters`, `avg_pace`, `avg_speed`) — always stored in metric
- `stationaryDetection.ts` thresholds — internal m/s values, not user-facing
- `useSaveSession` / `saveActivitySession` — all internal, metric units

## Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDDHHmmss_add_distance_unit.sql` | Create |
| `lib/stores/useUserStore.ts` | Modify (add `distance_unit` to `UserProfile`) |
| `database/settings/get-user-profile.ts` | Modify (add `distance_unit` to select) |
| `database/settings/save-user-profile.ts` | Modify (add `distance_unit` to payload type) |
| `app/menu/profile/index.tsx` | Modify (add distance unit selector) |
| `lib/formatDate.ts` | Modify (update `formatMeters`, `formatAveragePace`, add `formatSpeed`, `formatSpeedFromMs`, `formatAltitude`, `getDistanceUnitLabels`) |
| `features/activities/components/sessionStats.tsx` | Modify (use new formatters and dynamic labels) |
| `features/activities/cards/activity-feed-expanded/components/sessionStats.tsx` | Modify (dynamic unit labels) |
| `features/activities/lib/activityShareCardUtils.ts` | Modify (dynamic unit labels) |
| `features/activities/templates/components/TemplateHistoryModal.tsx` | Modify (dynamic pace label) |
| `locales/en/menu.json` | Modify (add `distanceUnit`) |
| `locales/fi/menu.json` | Modify (add `distanceUnit`) |

## Verification
1. Set distance unit to "mi" in profile settings — save and confirm it persists
2. Start a GPS activity — live stats show mph, min/mi, ft (altitude)
3. Complete the activity — session summary and share card show imperial units
4. View old activities in feed — expanded stats show imperial units
5. Check reports — total distance shows miles
6. Switch back to "km" — everything reverts to metric
7. New user signup — defaults to "km" without needing to set it
8. Template history modal and chart — pace shows correct unit
