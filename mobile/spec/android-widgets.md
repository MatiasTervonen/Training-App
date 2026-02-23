# Android Home Screen Widgets — Implementation Spec

## Context

Native Android home screen widgets for the Training-App. Two widget types:

1. **Quick Links Widget** — Configurable shortcut buttons that deep-link to specific app pages
2. **Steps Widget** — Shows today's step count, updated in near real-time

Both widgets are **fully configurable** — user chooses what to display via a configuration screen when placing the widget. Reconfigurable via long-press.

## Library: `react-native-android-widget`

- Widget UI written in React Native JSX (`FlexWidget`, `TextWidget`, `ImageWidget`)
- Expo config plugin handles native boilerplate (widget provider, manifest entries, etc.)
- Configuration screen in React Native (reuse existing components)
- Docs: https://saleksovski.github.io/react-native-android-widget/

---

## Step 1: Install & Configure

**Install:**
```bash
pnpm add react-native-android-widget
```

**Modify `mobile/package.json`:**
- Add dependency
- Set `"main": "index.ts"` (required for Expo Router + widget handler coexistence)

**Modify `mobile/app.config.js`:**
Add widget config plugin:
```typescript
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  fonts: ['./assets/fonts/Inter.ttf'], // if using custom fonts
  widgets: [
    {
      name: 'QuickLinks',
      label: 'MyTrack Quick Links',
      minWidth: '320dp',
      minHeight: '120dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Quick shortcuts to app pages',
      previewImage: './assets/widget-preview/quick-links.png',
      resizeMode: 'horizontal|vertical',
      widgetFeatures: 'reconfigurable',
    },
    {
      name: 'Steps',
      label: 'MyTrack Steps',
      minWidth: '180dp',
      minHeight: '110dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Today\'s step count',
      previewImage: './assets/widget-preview/steps.png',
      updatePeriodMillis: 1800000, // 30 min fallback auto-refresh (near real-time handled by other triggers)
      resizeMode: 'horizontal|vertical',
      widgetFeatures: 'reconfigurable',
    },
  ],
};
```

## Step 2: Create Entry Point + Task Handler

**Create `mobile/index.ts`:**
```typescript
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
```

**Create `mobile/widget-task-handler.tsx`:**
```typescript
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { QuickLinksWidget } from '@/features/widgets/QuickLinksWidget';
import { StepsWidget } from '@/features/widgets/StepsWidget';
import { getWidgetConfig } from '@/features/widgets/widget-storage';

const nameToWidget = {
  QuickLinks: QuickLinksWidget,
  Steps: StepsWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const config = await getWidgetConfig(widgetInfo.widgetId);
      props.renderWidget(<Widget config={config} widgetInfo={widgetInfo} />);
      break;
    }
    case 'WIDGET_DELETED':
      // Clean up stored config for this widget instance
      break;
    case 'WIDGET_CLICK':
      // Handle deep-link clicks — open the app to the target page
      // Use props.clickAction to determine which link was tapped
      break;
  }
}
```

## Step 3: Quick Links Widget

**Create `mobile/features/widgets/widget-constants.ts`:**

Available deep-link targets:
| Key | Label | Route | Icon |
|-----|-------|-------|------|
| `gym` | Gym | `/gym` | Dumbbell |
| `notes` | Notes | `/notes` | NotebookPen |
| `timer` | Timer | `/timer` | Timer |
| `activities` | Activities | `/activities` | Activity |
| `weight` | Weight | `/weight` | Scale |
| `reminders` | Reminders | `/reminders` | Bell |
| `todo` | Todo | `/todo` | ListTodo |
| `dashboard` | Dashboard | `/dashboard` | Home |
| `disc_golf` | Disc Golf | `/disc-golf` | Disc |

Each entry has: `key`, `labelEn`, `labelFi`, `route`, `iconResName`

**Create `mobile/features/widgets/QuickLinksWidget.tsx`:**
- Uses `FlexWidget` for layout (grid of shortcut buttons)
- Each button: icon + label, with `clickAction` set to the route path
- Dark themed (matches app: `#020618` / `#1d293d` gradient background)
- Adapts to widget size (show more/fewer buttons based on dimensions)

**Create `mobile/features/widgets/QuickLinksConfigScreen.tsx`:**
- Shown when user places widget + on long-press reconfigure
- Checklist of all available pages (toggle on/off)
- Reorder capability (drag or move up/down buttons)
- Save button → stores config via `widget-storage.ts` → calls `renderWidget` to finalize
- Uses existing app components: `AppText`, `AnimatedButton`
- Register via `registerWidgetConfigurationScreen` from the library

## Step 4: Steps Widget

**Create `mobile/features/widgets/StepsWidget.tsx`:**
- Large step count number (today's steps)
- "Steps today" label
- Optional: daily goal progress bar (if configured)
- Optional: small trend indicator (up/down vs yesterday)
- Click anywhere → opens `/activities` in the app
- Dark themed, matching app style

**Create `mobile/features/widgets/StepsConfigScreen.tsx`:**
- Toggle: show/hide daily goal
- Input: daily goal number (default 10000)
- Toggle: show/hide trend indicator
- Save → store config → render widget

**Steps data flow:**
1. Existing `StepCounterWorker` (WorkManager) already runs every 15 min and calls `recordReading()` which writes to `SharedPreferences`
2. Widget task handler reads today's steps from `SharedPreferences` on `WIDGET_UPDATE`
3. Near real-time updates are achieved through multiple trigger layers (see Step 4b below)

### Near Real-Time Update Strategy

The widget uses a **layered approach** with four update triggers to keep step data fresh without draining battery:

| Trigger | Mechanism | Latency | Battery Cost |
|---------|-----------|---------|--------------|
| Phone unlock | `ACTION_USER_PRESENT` BroadcastReceiver | ~instant | Negligible |
| Widget tap | Click handler refreshes before navigating | ~instant | None |
| App opens | `requestWidgetUpdate()` on foreground | ~instant | None |
| Background fallback | WorkManager (15 min) + `updatePeriodMillis` (30 min) | 15-30 min | Minimal |

## Step 4b: Near Real-Time Widget Updates (Native)

### Trigger 1: Screen Unlock — BroadcastReceiver

**Create `mobile/android/app/src/main/java/com/layer100crypto/MyTrack/step/StepWidgetUpdateReceiver.kt`:**
```kotlin
package com.layer100crypto.MyTrack.step

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class StepWidgetUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        val helper = StepCounterHelper(context)
        if (!helper.hasSensor()) return

        // Record latest sensor reading → updates SharedPreferences
        helper.recordReading()

        // Trigger widget refresh via AppWidgetManager
        val manager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, StepsWidgetProvider::class.java)
        val ids = manager.getAppWidgetIds(component)
        if (ids.isNotEmpty()) {
            val updateIntent = Intent(context, StepsWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(updateIntent)
        }
    }
}
```

**Note:** The `StepsWidgetProvider` class is auto-generated by `react-native-android-widget`'s Expo config plugin. Verify the exact class name after running `expo prebuild`. If the library uses a different provider class name, update the `ComponentName` accordingly.

**Modify `mobile/android/app/src/main/AndroidManifest.xml`** (or via Expo config plugin):
```xml
<receiver
    android:name=".step.StepWidgetUpdateReceiver"
    android:exported="false">
    <intent-filter>
        <action android:name="android.intent.action.USER_PRESENT" />
    </intent-filter>
</receiver>
```

### Trigger 2: Widget Tap — Click-to-Refresh

In `StepsWidget.tsx`, the root `FlexWidget` uses a `clickAction` that:
1. Triggers `WIDGET_CLICK` in the task handler
2. Task handler reads fresh steps from `SharedPreferences`, re-renders the widget, then deep-links to `/activities`

Update `widget-task-handler.tsx` `WIDGET_CLICK` case:
```typescript
case 'WIDGET_CLICK': {
    // Re-render widget with fresh data before navigating
    if (widgetInfo.widgetName === 'Steps') {
        const config = await getWidgetConfig(widgetInfo.widgetId);
        props.renderWidget(<StepsWidget config={config} widgetInfo={widgetInfo} />);
    }
    // Deep-link to target route
    const route = props.clickAction;
    if (route) {
        Linking.openURL(`mytrack://${route}`);
    }
    break;
}
```

### Trigger 3: App Foreground — JS-Side Update

**Modify `mobile/app/_layout.tsx`:**

When the app comes to foreground, trigger a widget update so the widget reflects the latest data:
```typescript
import { requestWidgetUpdate } from 'react-native-android-widget';
import { StepsWidget } from '@/features/widgets/StepsWidget';

// Inside the existing AppState foreground listener:
if (nextAppState === 'active') {
    // ... existing foreground logic ...

    // Refresh Steps widget
    requestWidgetUpdate({
        widgetName: 'Steps',
        renderWidget: () => <StepsWidget />,
    });
}
```

### Trigger 4: Background Fallback

Already handled by:
- `StepCounterWorker` (WorkManager, every 15 min) — records sensor reading to `SharedPreferences`
- `updatePeriodMillis: 1800000` (30 min) — Android triggers `WIDGET_UPDATE` on the widget

**Modify `StepCounterWorker.kt`** to also trigger a widget refresh after recording:
```kotlin
override fun doWork(): Result {
    val helper = StepCounterHelper(applicationContext)
    if (!helper.hasSensor()) return Result.success()

    helper.recordReading()

    // Also trigger widget update
    val manager = AppWidgetManager.getInstance(applicationContext)
    val component = ComponentName(applicationContext, StepsWidgetProvider::class.java)
    val ids = manager.getAppWidgetIds(component)
    if (ids.isNotEmpty()) {
        val intent = Intent(applicationContext, StepsWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }
        applicationContext.sendBroadcast(intent)
    }

    return Result.success()
}
```

---

## Step 5: Widget Config Storage

**Create `mobile/features/widgets/widget-storage.ts`:**
```typescript
// Keys: `widget_quicklinks_${widgetId}`, `widget_steps_${widgetId}`
// Quick Links config shape:
interface QuickLinksConfig {
  selectedLinks: string[]; // keys from widget-constants
}

// Steps config shape:
interface StepsConfig {
  showGoal: boolean;
  dailyGoal: number;
  showTrend: boolean;
}

export async function getWidgetConfig(widgetId: number): Promise<...>
export async function saveWidgetConfig(widgetId: number, config: ...): Promise<void>
export async function deleteWidgetConfig(widgetId: number): Promise<void>
```

Uses `AsyncStorage` under the hood.

## Step 6: Preview Images & Translations

**Create:**
- `mobile/assets/widget-preview/quick-links.png` — screenshot/mockup of widget
- `mobile/assets/widget-preview/steps.png` — screenshot/mockup of widget

**Modify translations:**
- `mobile/locales/en/common.json` — add widget strings (labels, config screen text)
- `mobile/locales/fi/common.json` — Finnish translations

---

## File Summary

### New files
| File | Purpose |
|------|---------|
| `mobile/index.ts` | App entry point + widget task handler registration |
| `mobile/widget-task-handler.tsx` | Central widget lifecycle handler |
| `mobile/features/widgets/QuickLinksWidget.tsx` | Quick Links widget UI (JSX) |
| `mobile/features/widgets/QuickLinksConfigScreen.tsx` | Quick Links configuration screen |
| `mobile/features/widgets/StepsWidget.tsx` | Steps counter widget UI (JSX) |
| `mobile/features/widgets/StepsConfigScreen.tsx` | Steps widget configuration screen |
| `mobile/features/widgets/widget-constants.ts` | Available pages catalog + shared types |
| `mobile/features/widgets/widget-storage.ts` | AsyncStorage helpers for widget config |
| `mobile/assets/widget-preview/quick-links.png` | Preview for widget picker |
| `mobile/assets/widget-preview/steps.png` | Preview for widget picker |
| `mobile/android/.../step/StepWidgetUpdateReceiver.kt` | BroadcastReceiver for screen unlock → widget refresh |

### Modified files
| File | Change |
|------|--------|
| `mobile/package.json` | Add `react-native-android-widget`, set `"main": "index.ts"` |
| `mobile/app.config.js` | Add widget config plugin with both widget definitions |
| `mobile/locales/en/common.json` | Widget-related strings |
| `mobile/locales/fi/common.json` | Finnish translations |
| `mobile/android/.../step/StepCounterWorker.kt` | Trigger widget refresh after recording steps |
| `mobile/android/app/src/main/AndroidManifest.xml` | Register `StepWidgetUpdateReceiver` for `ACTION_USER_PRESENT` |
| `mobile/app/_layout.tsx` | Call `requestWidgetUpdate()` when app comes to foreground |

---

## Verification

1. `pnpm install` in `mobile/`
2. `npx expo prebuild --clean` to regenerate native project with widget plugin
3. `npx expo run:android` to build dev client
4. On Android home screen → long-press → Widgets → find "MyTrack" section
5. **Quick Links**: Add widget → config screen appears → select pages → save → widget shows shortcuts → tap shortcut → app opens to correct page
6. **Steps**: Add widget → shows step count → verify near real-time updates:
   - Lock/unlock phone → widget should refresh within seconds
   - Tap the widget → step count refreshes, then app opens to Activities
   - Open the app → widget updates in background
   - Wait 15+ min without interaction → WorkManager fallback updates the widget
7. Long-press either widget → "Reconfigure" → change settings → widget updates

## Key Patterns to Follow (from CLAUDE.md)
- Use `className` (NativeWind) for styling in config screens — never inline `style`
- Use `AppText` for all text in config screens — never raw `<Text>`
- Use `AnimatedButton` instead of `Pressable` in config screens
- Use absolute imports (`@/features/widgets/...`)
- Add translations to `locales/` for all user-facing text
- Never use `any` type
