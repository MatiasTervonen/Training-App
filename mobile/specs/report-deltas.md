# Report Deltas - Period-over-Period Comparison

Show how each stat changed compared to the previous report period (e.g. this week vs last week).

## How it works

When a report is generated, the `report_generate` RPC looks up the most recent previous report for the same schedule. It stores that report's data as `previous_data` inside the new report's `report_data` JSONB. This means:

- No schema migration needed (JSONB is flexible)
- No changes to Edge Function or manual SQL - the RPC handles everything
- The first report for a schedule has no `previous_data` (no deltas shown)
- `previous_data` from the old report is stripped to prevent infinite nesting

## Data layer

### 1. Update `report_generate` RPC

Before inserting the new report, query the most recent `generated_reports` row for the same `schedule_id`. Merge its `report_data` (without its own `previous_data`) into the new report as `previous_data`:

```sql
-- Look up the most recent previous report for this schedule
SELECT gr.report_data INTO v_previous_data
FROM generated_reports gr
WHERE gr.schedule_id = p_schedule_id
ORDER BY gr.created_at DESC
LIMIT 1;

-- Build final data with previous_data for delta comparison
v_final_data := p_report_data;
IF v_previous_data IS NOT NULL THEN
  v_final_data := v_final_data || jsonb_build_object(
    'previous_data', v_previous_data - 'previous_data'
  );
END IF;
```

Then use `v_final_data` instead of `p_report_data` in the INSERT.

### 2. Update TypeScript types

Add `previous_data` to `ReportData` in `types/report.ts`:

```ts
export type ReportData = {
  gym?: GymReportData;
  activities?: ActivitiesReportData;
  weight?: WeightReportData;
  habits?: HabitsReportData;
  todo?: TodoReportData;
  previous_data?: {
    gym?: GymReportData;
    activities?: ActivitiesReportData;
    weight?: WeightReportData;
    habits?: HabitsReportData;
    todo?: TodoReportData;
  };
};
```

### 3. No Edge Function / manual SQL changes needed

The RPC handles embedding `previous_data` automatically. Callers just pass the current period's data as before.

## UI layer

### Display format

Each `StatRow` shows a colored delta indicator next to the value:

```
Sessions        5       ▲ +2        (green)
Volume          1,234   ▼ -100      (red)
Calories        450                 (no delta = first report)
```

- **Green** `▲` for increase (positive delta)
- **Red** `▼` for decrease (negative delta)
- **Gray** `—` for no change (delta = 0)
- **Nothing** when there's no previous report

### StatRow changes

Update `StatRow` in `ReportSection.tsx` to accept a delta:

```tsx
function StatRow({ label, value, delta }: {
  label: string;
  value: string;
  delta?: { text: string; direction: "up" | "down" | "same" } | null;
}) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-700/50">
      <AppText className="text-gray-400 text-sm">{label}</AppText>
      <View className="flex-row items-center gap-2">
        <AppText className="text-gray-100 text-sm">{value}</AppText>
        {delta && delta.direction === "up" && (
          <AppText className="text-xs text-green-400">▲ {delta.text}</AppText>
        )}
        {delta && delta.direction === "down" && (
          <AppText className="text-xs text-red-400">▼ {delta.text}</AppText>
        )}
        {delta && delta.direction === "same" && (
          <AppText className="text-xs text-gray-500">—</AppText>
        )}
      </View>
    </View>
  );
}
```

### Delta helper

Create a helper to compute and format deltas:

```tsx
function makeDelta(
  current: number,
  previous: number | undefined | null,
  format?: (n: number) => string,
): { text: string; direction: "up" | "down" | "same" } | null {
  if (previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return { text: "0", direction: "same" };
  const direction = diff > 0 ? "up" : "down";
  const abs = Math.abs(diff);
  const prefix = diff > 0 ? "+" : "-";
  const text = format ? `${prefix}${format(abs)}` : `${prefix}${abs}`;
  return { text, direction };
}
```

### Section changes

Each section receives `previousData` from `data.previous_data?.[feature]` and passes deltas to StatRow. Example for gym:

```tsx
function GymSection({ data, prev }: { data: GymReportData; prev?: GymReportData }) {
  const { t } = useTranslation("reports");
  return (
    <>
      <StatRow
        label={t("reports.expanded.sessions")}
        value={String(data.session_count)}
        delta={makeDelta(data.session_count, prev?.session_count)}
      />
      <StatRow
        label={t("reports.expanded.totalVolume")}
        value={`${data.total_volume.toLocaleString()} kg`}
        delta={makeDelta(data.total_volume, prev?.total_volume)}
      />
      <StatRow
        label={t("reports.expanded.totalDuration")}
        value={formatDuration(data.total_duration)}
        delta={makeDelta(data.total_duration, prev?.total_duration, (n) => formatDuration(n))}
      />
      {/* ... same pattern for other stats */}
    </>
  );
}
```

### Formatting rules per stat type

- **Plain numbers** (sessions, exercises, calories, steps, entries, completions, tasks): raw number, e.g. `+2`, `-5`
- **Duration** (total_duration, avg_duration): format with `formatDuration`, e.g. `+15 m`, `-1 h 5 m`
- **Distance** (total_distance_meters): format with `formatMeters`, e.g. `+2.5 km`, `-500.0 m`
- **Weight** (start_weight, end_weight, change): show kg, e.g. `+0.5 kg`, `-1.2 kg`. Round to 1 decimal.
- **Percentage** (completion_rate): append `%`, e.g. `+12%`, `-5%`
- **Ratio** (days_all_done): raw number, e.g. `+3`, `-1`

### Share card

No changes — the share card is already dense with stats. Deltas are only shown in the expanded report view.

## Files to modify

1. `supabase/migrations/20260306160000_report_deltas.sql` - new migration updating `report_generate`
2. `mobile/types/report.ts` - add `previous_data` to `ReportData`
3. `mobile/features/reports/components/ReportSection.tsx` - StatRow deltas + makeDelta helper


## Notes

- Weight section: `start_weight` and `end_weight` deltas compare this period's start/end to last period's start/end. `change` delta = "you lost X more than last period".
- No translations needed - deltas are numbers with arrows.
- The `previous_data` key is automatically stripped when it becomes the "previous" of a future report, preventing infinite nesting.
