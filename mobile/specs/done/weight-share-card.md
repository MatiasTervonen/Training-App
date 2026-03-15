# Weight Analytics Share Card

## Context
Users can share gym workout cards from the expanded feed view and the training-finished page. The weight analytics page shows weight trends over time with selectable time ranges (7 days, 30 days, 1 year) but has no sharing capability. We want to add a share button so users can generate and share a styled 1080x1080 image of their weight chart and stats for the currently selected time range.

Not included: Share for weight feed expanded card — the analytics page shows trends which are more share-worthy than a single weight measurement.

## Approach
- Add a share button to the weight analytics page header (next to the title)
- Open a modal with a scaled preview of a 1080x1080 share card
- The share card contains a weight chart rendered with `SvgChart` (SVGRenderer) instead of `SkiaChart` — SVG renders to native views, reliably captured by `makeImageFromView`
- Reuse the existing `useShareCard` hook from `lib/hooks/useShareCard.ts` (it's fully generic — supports both share sheet and save to gallery)
- The card shows the chart for the currently selected time range, weight change, and current weight

## Share Card Design

```
┌──────────────────────────────────┐
│  [App icon]  MyTrack             │  ← App branding
│                                  │
│        Weight Analytics          │  ← Title
│    Feb 2, 2026 - Mar 4, 2026    │  ← Date range
│             30D                  │  ← Range badge
│                                  │
│  ┌──────────────────────────────┐│
│  │                              ││
│  │    [WEIGHT LINE CHART]       ││  ← SvgChart, 960×400
│  │    (smooth line + area fill) ││
│  │                              ││
│  └──────────────────────────────┘│
│                                  │
│  ┌─────────────┐ ┌─────────────┐│
│  │Weight Change │ │Current Weight│  ← StatBox (same style as gym)
│  │  - 2.3 kg   │ │  78.5 kg    ││
│  └─────────────┘ └─────────────┘│
│                                  │
│            MyTrack               │  ← Footer watermark
└──────────────────────────────────┘
```

StatBox uses the same styling as gym ShareCard's StatBox: `border-blue-500 border rounded-lg bg-slate-950/50`. Background is `LinearGradient` with `["#1e3a8a", "#0f172a", "#0f172a"]`.

## Chart Rendering Strategy

The interactive WeightChart uses `SkiaChart` + `SkiaRenderer` from `@wuba/react-native-echarts`. For the share card, use `SvgChart` + `SVGRenderer` instead:
- SVG renders to native `react-native-svg` views (already installed v15.12.1)
- Native views are reliably captured by Skia's `makeImageFromView`
- Fixed dimensions: 960×400 (no `onLayout` needed since card is always 1080px wide)
- Chart options match WeightChart styling but with larger fonts (24px labels, 5px line width) for 1080px resolution
- The chart is initialized via `useEffect` on mount — by the time the user taps Share, it's fully rendered

Fallback if SvgChart capture fails: use `chart.getDataURL()` to get a base64 image, render as `<Image>` in the card.

## Data Flow

```
AllDataTable (owns range, data, weightUnit, isShareModalOpen state)
  → HeaderAllDataTable (receives onSharePress callback)
  → WeightShareModal (receives visible, onClose, range, data, weightUnit)
    → useShareCard() hook (reused from gym, no changes needed)
    → WeightShareCard (ref=cardRef, range, data, weightUnit)
      → SvgChart (fixed 960×400, initialized via useEffect)
```

## Implementation Steps

### 1. Create WeightShareCard component
**New file: `features/weight/components/WeightShareCard.tsx`**

- `forwardRef<View, WeightShareCardProps>` for Skia capture
- Fixed size: `w-[1080px] h-[1080px]` with `collapsable={false}`
- Props: `range` ("week" | "month" | "year"), `data` (weight[]), `weightUnit` (string)
- Internally computes chart data using same logic as WeightChart (date range, filtering, forward-fill)
- Chart uses `SvgChart` + `SVGRenderer` at fixed 960×400
- Chart options: same style as WeightChart but scaled for 1080px (larger fonts, thicker lines)
- Two StatBox: "Weight Change" and "Current Weight"
- Range badge showing "7D" / "30D" / "1Y"

### 2. Create WeightShareModal component
**New file: `features/weight/components/WeightShareModal.tsx`**

Same pattern as `features/activities/components/share/ActivityShareModal.tsx`:
- Props: `visible`, `onClose`, `range`, `data` (weight[]), `weightUnit`
- Uses `useShareCard()` from `@/lib/hooks/useShareCard`
- Scaled preview: `scale = (containerWidth - 40) / 1080`, max 0.4
- Container + Transform pattern with overflow hidden
- Button layout (matches activity share modal):
  - Row of two buttons side by side:
    - Save to Gallery (btn-neutral, Download icon) — calls `saveCardToGallery()`, shows success/error toast
    - Share (btn-base, Share2 icon) — calls `shareCard()`, opens native share sheet
  - Full-width Close button below (btn-neutral)
- Buttons disabled while `isSaving` or `isSharing`

### 3. Add share button to analytics header
**Modify: `features/weight/headerAllDataTable.tsx`**

- Add `onSharePress` callback prop
- Add Share2 icon button right-aligned next to the title
- Match gym-expanded pattern: spacer + title + button

### 4. Wire up modal in AllDataTable
**Modify: `features/weight/AllDataTable.tsx`**

- Add `isShareModalOpen` state
- Pass `onSharePress={() => setIsShareModalOpen(true)}` to HeaderAllDataTable
- Render `WeightShareModal` as sibling to SectionList (wrap in fragment)
- Pass `range`, `data`, `weightUnit` to the modal

### 5. Add translations
**Modify: `locales/en/weight.json`** — add `weight.share` section:
```json
"share": {
  "share": "Share",
  "sharing": "Sharing...",
  "save": "Save",
  "saving": "Saving...",
  "saveSuccess": "Weight chart saved to gallery",
  "saveError": "Failed to save weight chart",
  "close": "Close",
  "shareError": "Failed to share weight chart",
  "weightChange": "Weight Change",
  "currentWeight": "Current Weight",
  "title": "Weight Analytics"
}
```

**Modify: `locales/fi/weight.json`** — add `weight.share` section:
```json
"share": {
  "share": "Jaa",
  "sharing": "Jaetaan...",
  "save": "Tallenna",
  "saving": "Tallennetaan...",
  "saveSuccess": "Painokaavio tallennettu galleriaan",
  "saveError": "Painokaavion tallentaminen epäonnistui",
  "close": "Sulje",
  "shareError": "Painokaavion jakaminen epäonnistui",
  "weightChange": "Painon muutos",
  "currentWeight": "Nykyinen paino",
  "title": "Painoanalytiikka"
}
```

## Files Summary

| File | Action |
|------|--------|
| `features/weight/components/WeightShareCard.tsx` | Create |
| `features/weight/components/WeightShareModal.tsx` | Create |
| `features/weight/headerAllDataTable.tsx` | Modify (add share button + onSharePress prop) |
| `features/weight/AllDataTable.tsx` | Modify (add modal state + render WeightShareModal) |
| `locales/en/weight.json` | Modify (add weight.share translations) |
| `locales/fi/weight.json` | Modify (add weight.share translations) |

## Reusable Code

| What | Source Location |
|------|----------------|
| Share capture, native share sheet + save to gallery | `lib/hooks/useShareCard.ts` (reuse as-is) |
| StatBox UI pattern | `features/gym/components/ShareCard.tsx` (lines 135-142) |
| Button layout (Save + Share row, Close below) | `features/activities/components/share/ActivityShareModal.tsx` (lines 210-258) |
| Scaled preview + transform pattern | `features/activities/components/share/ActivityShareModal.tsx` (lines 155-181) |
| Chart data processing (date ranges, filtering, forward-fill) | `features/weight/WeightChart.tsx` (lines 19-91, 129-163) |
| Duration/date formatting | `lib/formatDate.ts` |

## Verification
1. Open weight analytics → select each range (7D, 30D, 1Y)
2. Tap share icon → modal opens with scaled card preview showing chart + stats
3. Verify chart matches the selected time range and has correct date labels
4. Tap Share → native share sheet opens with captured 1080×1080 PNG
5. Tap Save → image saved to gallery, success toast shown
6. Verify captured image has chart visible (SvgChart capture works)
7. Verify buttons are disabled while sharing/saving is in progress
8. Navigate between time periods with arrows → share reflects the current period's data
9. Test with minimal data (1-2 entries) and verify card still looks reasonable
10. Test both English and Finnish translations
