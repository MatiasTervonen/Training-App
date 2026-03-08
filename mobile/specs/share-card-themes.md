# Share Card Themes & Sizes

## Context
All share cards (Activity, Gym, Weight, Steps, Reports) are currently fixed at 1080×1080 with a single blue gradient theme. Users should be able to pick different visual themes and card sizes before sharing.

## Current Share Cards
| Feature | Card Component | Modal Component | Content |
|---------|---------------|-----------------|---------|
| Activity | `features/activities/components/share/ActivityShareCard.tsx` | `features/activities/components/share/ActivityShareModal.tsx` | Map snapshot + stat grid |
| Gym | `features/gym/components/ShareCard.tsx` | `features/gym/components/ShareModal.tsx` | 2×2 stats + top 3 exercises |
| Weight | `features/weight/components/WeightShareCard.tsx` | `features/weight/components/WeightShareModal.tsx` | Chart image + 2 stat boxes |
| Steps | `features/activities/analytics/StepsShareCard.tsx` | `features/activities/analytics/StepsShareModal.tsx` | Chart image + 2 stat boxes |
| Reports | `features/reports/components/ReportShareCard.tsx` | `features/reports/components/ReportShareModal.tsx` | Multi-feature report grid |

All use `lib/hooks/useShareCard.ts` for capture + share (except gym which has its own but same pattern).

## Sizes

Three aspect ratios, all at 2× density for sharp output:

| Name | Dimensions | Aspect Ratio | Use Case |
|------|-----------|--------------|----------|
| Square | 1080×1080 | 1:1 | Instagram posts, general sharing |
| Story | 1080×1920 | 9:16 | Instagram/WhatsApp stories, TikTok |
| Wide | 1920×1080 | 16:9 | Twitter/Facebook, landscape |

## Themes

Four themes to start. All themes must work with every card type and every size.

### 1. Classic (current default)
- Background: `LinearGradient` `["#1e3a8a", "#0f172a", "#0f172a"]`
- Stat boxes: `border-blue-500 border rounded-lg bg-slate-950/50`
- Text: white/gray-300/gray-400
- This is the existing theme — no visual changes needed, just refactored into the theme system

### 2. Midnight
- Background: solid `#000000`
- Stat boxes: `border-gray-700 border rounded-lg bg-gray-900/80`
- Accent: `#a855f7` (purple) for highlights
- Text: white/gray-300

### 3. Clean
- Background: solid `#ffffff`
- Stat boxes: `border-gray-200 border rounded-lg bg-gray-50`
- Accent: `#2563eb` (blue-600) for highlights
- Text: `#0f172a` (slate-900) / `#475569` (slate-500)
- App logo uses dark variant

### 4. Forest
- Background: `LinearGradient` `["#064e3b", "#022c22", "#022c22"]`
- Stat boxes: `border-emerald-600 border rounded-lg bg-emerald-950/50`
- Text: white/emerald-200/emerald-300

## Theme Type Definition

```ts
type ShareCardTheme = {
  id: "classic" | "midnight" | "clean" | "forest";
  colors: {
    background: string[];            // gradient colors (1 = solid, 2+ = gradient)
    gradientStart?: { x: number; y: number };
    gradientEnd?: { x: number; y: number };
    statBoxBorder: string;
    statBoxBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
  };
};

type ShareCardSize = "square" | "story" | "wide";

type ShareCardDimensions = {
  width: number;
  height: number;
};
```

## Shared Constants

```ts
const SHARE_CARD_DIMENSIONS: Record<ShareCardSize, ShareCardDimensions> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1920, height: 1080 },
};
```

## Layout Adaptations Per Size

Each card type adapts its internal layout based on the selected size. The content stays the same — only spacing, proportions, and arrangement change.

### Activity Card
| Size | Layout |
|------|--------|
| Square | Current: map top 63%, stats bottom 37% |
| Story | Map top 55%, title overlay on map, stats spread out with more vertical space below |
| Wide | Map left 55%, stats stacked vertically on the right side |

### Gym Card
| Size | Layout |
|------|--------|
| Square | Current: header, title, 2×2 stats, top exercises, footer |
| Story | Same order, more vertical spacing, larger stat boxes, more exercise rows visible |
| Wide | Left: header + title + stats (2×2). Right: top exercises list |

### Weight / Steps Card
| Size | Layout |
|------|--------|
| Square | Current: title, chart, 2 stat boxes |
| Story | Title at top, taller chart area, stat boxes below with more space |
| Wide | Chart takes left 60%, title + stats stacked on the right |

### Reports Card
| Size | Layout |
|------|--------|
| Square | Current: adaptive grid of feature cards |
| Story | Feature cards stack vertically with more room |
| Wide | Feature cards spread horizontally |

## Shared UI Components

### 1. Theme & Size Picker — `lib/components/share/ShareCardPicker.tsx`

A compact picker shown in every share modal between the card preview and the action buttons.

```
┌─────────────────────────────────────┐
│  Size:  [□] [▯] [▬]                │  ← 3 icon buttons (square/story/wide)
│                                     │
│  Theme: [●][●][●][●]               │  ← 4 color dots, horizontal scroll
│          Classic Midnight Clean Forest │
└─────────────────────────────────────┘
```

**Size picker:** 3 small buttons showing the aspect ratio as outlined shapes. Selected = filled, unselected = outlined.

**Theme picker:** Row of small circles showing each theme's primary background color. Selected theme has a ring around it. Label below each dot.

Props:
```ts
type ShareCardPickerProps = {
  selectedSize: ShareCardSize;
  onSizeChange: (size: ShareCardSize) => void;
  selectedTheme: ShareCardTheme["id"];
  onThemeChange: (theme: ShareCardTheme["id"]) => void;
};
```

### 2. Themed StatBox — `lib/components/share/ThemedStatBox.tsx`

Replace per-feature `StatBox` with a shared themed version:

```ts
type ThemedStatBoxProps = {
  label: string;
  value: string;
  theme: ShareCardTheme;
  size?: "normal" | "large";  // large = primary stat in non-GPS activity
};
```

### 3. Themed Card Wrapper — `lib/components/share/ThemedCardWrapper.tsx`

Wraps card content with the correct background (gradient or solid), dimensions, and `collapsable={false}` + `ref` forwarding.

```ts
type ThemedCardWrapperProps = {
  theme: ShareCardTheme;
  size: ShareCardSize;
  children: React.ReactNode;
};
```

## User Preference Persistence

Store the user's last selected theme and size in AsyncStorage:

```ts
// Key: "share_card_preferences"
// Value: { theme: ShareCardTheme["id"], size: ShareCardSize }
```

When a share modal opens, load saved preferences as initial state. Save on every change. This way users don't have to re-pick every time.

Hook: `lib/hooks/useShareCardPreferences.ts`

```ts
function useShareCardPreferences(): {
  theme: ShareCardTheme["id"];
  size: ShareCardSize;
  setTheme: (theme: ShareCardTheme["id"]) => void;
  setSize: (size: ShareCardSize) => void;
  isLoaded: boolean;
};
```

## Preview Scaling in Modals

The preview scaling logic currently assumes 1080×1080. It needs to adapt to the selected size:

```ts
const dims = SHARE_CARD_DIMENSIONS[selectedSize];
const scaleX = (containerWidth - 40) / dims.width;
const scaleY = (containerHeight * 0.45) / dims.height;  // don't let preview exceed 45% of modal height
const scale = Math.min(scaleX, scaleY, 0.4);
```

The container style and transform style both use `dims.width * scale` and `dims.height * scale`.

## Implementation Steps

### Phase 1: Shared Infrastructure

#### 1. Create theme definitions — `lib/share/themes.ts`
- Export `SHARE_THEMES` array with the 4 theme objects
- Export `SHARE_CARD_DIMENSIONS` map
- Export `getTheme(id)` helper
- Export TypeScript types

#### 2. Create `ThemedCardWrapper` — `lib/components/share/ThemedCardWrapper.tsx`
- `forwardRef` wrapper with gradient/solid background
- Reads `width` and `height` from `SHARE_CARD_DIMENSIONS[size]`
- Sets `collapsable={false}` for Skia capture

#### 3. Create `ThemedStatBox` — `lib/components/share/ThemedStatBox.tsx`
- Accepts `theme` prop for colors
- `size="large"` variant for primary stats

#### 4. Create `ShareCardPicker` — `lib/components/share/ShareCardPicker.tsx`
- Size buttons + theme dots
- Calls `onSizeChange` / `onThemeChange`

#### 5. Create `useShareCardPreferences` — `lib/hooks/useShareCardPreferences.ts`
- AsyncStorage read/write
- Returns current theme/size + setters

#### 6. Update `useShareCard` hook — `lib/hooks/useShareCard.ts`
- Accept `size: ShareCardSize` parameter
- Use correct dimensions when capturing

### Phase 2: Migrate Each Card

For each of the 5 share card types, the pattern is the same:

1. **Update the card component** to accept `theme` and `size` props
2. **Replace** hardcoded gradient/colors with theme values
3. **Replace** `w-[1080px] h-[1080px]` with `ThemedCardWrapper`
4. **Replace** local `StatBox` with `ThemedStatBox`
5. **Add layout variants** for story/wide sizes
6. **Update the modal component** to include `ShareCardPicker`
7. **Update preview scaling** to use size-aware logic

#### Order of migration:
1. **Gym** — simplest card, good test case
2. **Weight** — chart-based, tests chart sizing
3. **Steps** — similar to weight
4. **Activity** — most complex (map + stats + stat selection)
5. **Reports** — most complex layout (multi-feature grid)

### Phase 3: Translations

Add translations for theme names and size labels:

**`locales/en/common.json`** — add `share` section:
```json
"share": {
  "sizeLabel": "Size",
  "themeLabel": "Theme",
  "sizeSquare": "Square",
  "sizeStory": "Story",
  "sizeWide": "Wide",
  "themeClassic": "Classic",
  "themeMidnight": "Midnight",
  "themeClean": "Clean",
  "themeForest": "Forest"
}
```

**`locales/fi/common.json`** — add `share` section:
```json
"share": {
  "sizeLabel": "Koko",
  "themeLabel": "Teema",
  "sizeSquare": "Neliö",
  "sizeStory": "Tarina",
  "sizeWide": "Leveä",
  "themeClassic": "Klassinen",
  "themeMidnight": "Yö",
  "themeClean": "Vaalea",
  "themeForest": "Metsä"
}
```

## Files Summary

| File | Action |
|------|--------|
| `lib/share/themes.ts` | Create — theme definitions + size dimensions + types |
| `lib/components/share/ThemedCardWrapper.tsx` | Create — themed background wrapper with ref forwarding |
| `lib/components/share/ThemedStatBox.tsx` | Create — themed stat box |
| `lib/components/share/ShareCardPicker.tsx` | Create — size + theme picker UI |
| `lib/hooks/useShareCardPreferences.ts` | Create — AsyncStorage persistence |
| `lib/hooks/useShareCard.ts` | Modify — accept size param for dimensions |
| `features/gym/components/ShareCard.tsx` | Modify — accept theme/size, use shared components |
| `features/gym/components/ShareModal.tsx` | Modify — add picker, size-aware preview |
| `features/weight/components/WeightShareCard.tsx` | Modify — accept theme/size, use shared components |
| `features/weight/components/WeightShareModal.tsx` | Modify — add picker, size-aware preview |
| `features/activities/analytics/StepsShareCard.tsx` | Modify — accept theme/size, use shared components |
| `features/activities/analytics/StepsShareModal.tsx` | Modify — add picker, size-aware preview |
| `features/activities/components/share/ActivityShareCard.tsx` | Modify — accept theme/size, use shared components |
| `features/activities/components/share/ActivityShareModal.tsx` | Modify — add picker, size-aware preview |
| `features/reports/components/ReportShareCard.tsx` | Modify — accept theme/size, use shared components |
| `features/reports/components/ReportShareModal.tsx` | Modify — add picker, size-aware preview |
| `locales/en/common.json` | Modify — add share theme/size translations |
| `locales/fi/common.json` | Modify — add share theme/size translations |

## Verification
1. Open each share modal (Gym, Weight, Steps, Activity, Reports)
2. Size picker: tap each size → preview updates dimensions and layout
3. Theme picker: tap each theme → preview updates colors
4. Share/save → output image matches selected size and theme
5. Close and reopen modal → last selected theme and size are remembered
6. Test story size shared to Instagram stories → fills full screen
7. Test wide size → correct 16:9 output
8. Activity card with map: map section adapts to each size
9. Weight/Steps cards: chart area resizes proportionally for each size
10. Clean theme: verify dark text on light background is readable
11. Verify all translations (EN + FI)
