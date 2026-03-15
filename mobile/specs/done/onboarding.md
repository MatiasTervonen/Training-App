# Onboarding Specification

## Overview

A step-by-step onboarding flow shown to new users after their first login. The onboarding guides users through initial setup (language, permissions, personal data) while explaining **why** each item matters. Users can skip the entire onboarding at any time — a persistent banner or prompt reminds them they can complete setup later from Settings/Profile.

---

## Entry Point

- Triggers **once** after first successful login (including guest login).
- A flag `has_completed_onboarding` is stored in the user store (Zustand + Supabase `user_settings`).
- If `false` or missing → redirect to `/onboarding` before reaching the dashboard.
- If the user skips → flag is set to `true` (same as completing).

---

## Screen Flow

```
Welcome → Language → Permissions → Weight → Finish
```

Each screen is a full-page view inside a dedicated `/app/onboarding/` route group. A progress indicator (dots or bar) shows where the user is. Every screen has a **"Skip onboarding"** option.

---

## Screen 1: Welcome

**Purpose:** Set the tone, explain what's coming.

| Element | Details |
|---------|---------|
| App logo + name | Centered, prominent |
| Headline | "Welcome to MyTrack!" |
| Body text | "Let's get you set up. This takes about a minute. You can skip at any time — everything can be configured later in Settings." |
| Primary button | "Let's go" → next screen |
| Secondary link | "Skip, I'll set things up later" → goes straight to dashboard |

---

## Screen 2: Language Selection

**Purpose:** Let the user choose their preferred language immediately so the rest of onboarding (and the app) is in their language.

| Element | Details |
|---------|---------|
| Headline | "Choose your language" |
| Options | English / Suomi — displayed as selectable cards with flag icons |
| Default | Pre-selected based on device locale |
| Behavior | Selecting a language immediately switches the app language (i18n locale + Supabase setting) so subsequent screens render in the chosen language |
| Primary button | "Continue" |
| Skip link | "Skip onboarding" |

**Why language first:** Everything after this screen should appear in the user's chosen language.

---

## Screen 3: Permissions

**Purpose:** Request the permissions the app needs, with clear explanations of **why** each is needed. Permissions are presented as individual toggleable cards — not a wall of system dialogs.

### Layout

A scrollable list of permission cards. Each card contains:
- Icon representing the feature
- Permission name
- 1–2 sentence explanation of why it's needed
- "Enable" button (triggers the native permission dialog)
- Status indicator (granted / denied / not yet asked)

### Permission Cards

#### 3a. Push Notifications
| Field | Value |
|-------|-------|
| Icon | Bell |
| Title | "Notifications" |
| Explanation | "Get reminders for your workouts, timers, and scheduled activities. Without this, reminders and alarms won't work when the app is in the background." |
| Action | Request notification permission via `expo-notifications` |
| Required? | No — optional but recommended |

#### 3b. Location (Foreground + Background)
| Field | Value |
|-------|-------|
| Icon | Map pin |
| Title | "Location tracking" |
| Explanation | "Track your route and distance during outdoor activities like running and cycling. Background location lets tracking continue even when the screen is off." |
| Action | Request foreground location first, then background location via `expo-location` |
| Required? | No — only needed for GPS-tracked activities |

#### 3c. Step Counter (Android only)
| Field | Value |
|-------|-------|
| Icon | Footprints |
| Title | "Step counter" |
| Explanation | "Count your daily steps using your phone's built-in sensor. This also powers the Steps home screen widget." |
| Action | Request activity recognition / step counter permission via native module |
| Required? | No — optional |
| Platform | Android only — hide on iOS |

#### 3d. Exact Alarms (Android only)
| Field | Value |
|-------|-------|
| Icon | Alarm clock |
| Title | "Exact alarms" |
| Explanation | "Allows timers and alarms to fire at the exact time you set, even when the app is closed." |
| Action | Request `SCHEDULE_EXACT_ALARM` via native module |
| Required? | No — only needed for timer/alarm features |
| Platform | Android only — hide on iOS |

### Bottom Section
| Element | Details |
|---------|---------|
| Info text | "You can change any of these later in Settings." |
| Primary button | "Continue" (enabled regardless of which permissions are granted) |
| Skip link | "Skip onboarding" |

**Design note:** Do NOT auto-fire all permission dialogs at once. Let the user tap "Enable" on each card individually. This gives them control and context.

---

## Screen 4: About You

**Purpose:** Collect personal data that improves the app experience.

### 4a. Weight

| Element | Details |
|---------|---------|
| Headline | "What's your weight?" |
| Explanation | "Your weight is used to estimate calories burned during activities. You can update it anytime in the Weight section." |
| Unit toggle | kg / lbs (default based on locale — kg for fi, lbs for en) |
| Input | Numeric input with unit suffix |
| Validation | Must be a reasonable number (30–300 kg / 66–660 lbs) or left empty |
| Optional | User can leave this blank and set it later |

### 4b. Weight Unit Preference

| Element | Details |
|---------|---------|
| Tied to the unit toggle above | Saving the weight also saves the preferred unit to the user profile |

### Bottom Section
| Element | Details |
|---------|---------|
| Primary button | "Continue" |
| Secondary link | "Skip" (just this step, continues to next screen) |
| Skip link | "Skip onboarding" |

---

## Screen 5: All Done

**Purpose:** Celebrate setup completion and guide the user into the app.

| Element | Details |
|---------|---------|
| Headline | "You're all set!" |
| Body text | "You can always adjust your settings, permissions, and profile from the menu. Enjoy tracking!" |
| Summary | Brief recap of what was configured (e.g., "Language: English, Notifications: enabled, Weight: 75 kg") — skip items that weren't set |
| Primary button | "Start using MyTrack" → navigate to `/dashboard`, set `has_completed_onboarding = true` |

---

## Skip Behavior

| Scenario | Behavior |
|----------|----------|
| User taps "Skip onboarding" on any screen | Show a confirmation: "Are you sure? You can set up everything later from Settings and Profile." |
| Confirmed | Set `has_completed_onboarding = true`, navigate to `/dashboard` |

---

## Technical Implementation

### Route Structure
```
app/
  onboarding/
    _layout.tsx        ← Onboarding layout (no tabs, no bottom nav)
    index.tsx          ← Welcome screen (step 1)
    language.tsx       ← Language selection (step 2)
    permissions.tsx    ← Permissions (step 3)
    about-you.tsx      ← Weight input (step 4)
    complete.tsx       ← All done screen (step 5)
```

### State Management
- Onboarding progress stored in a local Zustand store (not persisted — if the user kills the app mid-onboarding, they restart from the beginning).
- Final results (language, weight, unit, permission states) are saved to the existing `useUserStore` and synced to Supabase on completion.
- `has_completed_onboarding` flag persisted in both Zustand (AsyncStorage) and Supabase `user_settings`.

### Navigation Guard
- In `LayoutWrapper.tsx` or `_layout.tsx`, after confirming a valid auth session, check `has_completed_onboarding`.
- If `false`/missing → `router.replace("/onboarding")`.
- If `true` → proceed to dashboard as normal.

### Translations
- New namespace: `locales/en/onboarding.json` and `locales/fi/onboarding.json`.
- All onboarding text must be translated for both languages.

### Components to Reuse
- `AppText` for all text.
- `AnimatedButton` for all buttons.
- `ModalPageWrapper` for page wrapping.
- Existing permission-checking utilities from settings/features.

### New Components Needed
- `OnboardingProgressBar` — dot or bar indicator showing current step.
- `PermissionCard` — card component for each permission with icon, text, enable button, and status.
- `LanguageCard` — selectable card for language option.

---

## Database Changes

### `user_settings` table — new column:
```sql
has_completed_onboarding BOOLEAN DEFAULT FALSE
-- FALSE = never seen / not completed
-- TRUE = completed or skipped
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Guest login | Show onboarding normally — guests benefit from permissions too |
| User already has profile data (e.g., migrated from an older version) | Set `has_completed_onboarding = true` via a migration so existing users skip onboarding |
| Permission previously granted at OS level | Show the card as already enabled (green checkmark) |
| Permission denied at OS level | Show "Open Settings" button instead of "Enable" |
| User changes language mid-onboarding | All subsequent screens render in the new language immediately |
| App killed during onboarding | User sees onboarding again from the start on next launch |
| No internet during onboarding | Permissions and language work offline; weight/settings sync when connection returns |

---

## Visual Style

- Match the existing app aesthetic: dark gradient background, slate cards, blue accent buttons.
- Each screen should feel spacious — not cramped. One concept per screen.
- Use subtle animations (fade in, slide) for transitions between screens.
- Permission cards should have clear visual states: default (neutral), enabled (green/blue accent), denied (muted).

---

## Future Considerations (Not in V1)

These are ideas for later iterations — do NOT implement in the first version:

- **Goal setting** — "What are your fitness goals?" (lose weight, build muscle, stay active)
- **Feature highlights** — animated walkthrough of key features
- **Activity preferences** — "What activities do you do?" to customize the sessions screen
- **Notification time preferences** — "When would you like to receive reminders?"
- **Profile picture** — upload during onboarding
- **Dark/light theme** — if the app ever adds a light mode
