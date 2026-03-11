# New Features Review

Comprehensive review of the current app state and detailed specifications for 20 new features.

---

## Current App State

| Module | Status | Notes |
|--------|--------|-------|
| **Gym Workouts** | Production-ready | Exercises, sets/reps/weight/RPE, templates, rest timer, muscle groups, analytics, exercise history, supersets, sharing |
| **Activity Tracking** | Production-ready | GPS routes (Mapbox), steps, pace, distance, calories, voice notes, media, templates, sharing |
| **Habits & Streaks** | Production-ready | Manual + step-based, daily/weekly frequency, reminders, calendar view, confetti, sharing |
| **Timer / Stopwatch** | Production-ready | Countdown, stopwatch, saved timers, native alarms, notifications |
| **Notes** | Production-ready | Quick notes, folders, voice recordings, images, videos |
| **Reminders** | Production-ready | One-time, daily, weekly, global (cross-device), snooze, high-priority alarms |
| **Todo Lists** | Production-ready | Lists, tasks, reorder, media attachments, drafts |
| **Feed / Dashboard** | Production-ready | Unified feed, pinning (max 10), hiding, infinite scroll |
| **Weight Tracking** | Functional | Entries + data table, photos/videos, sharing — no trend chart yet |
| **Reports** | Functional | Scheduling exists, delivery and UI basic |
| **Auth** | Complete | Email, Google Sign-In, guest login |
| **Onboarding** | Complete | Language, permissions, weight/units, profile |
| **Friends** | Partial | DB schema + basic requests — no social feed UI |
| **Chat** | DB schema only | Tables designed, no UI |
| **Disc Golf** | DB schema only | Tables designed, no UI |
| **Android Widgets** | Partial | Steps widget, quick links |
| **i18n** | English + Finnish | Full coverage |

---

## Feature 1: Workout Programs / Training Plans

### Overview

Multi-week structured training programs with progressive overload. Users follow a planned schedule of workouts that automatically advances after each completed session.

### How It Works

**Program Creation:**
- New "Programs" section accessible from the sessions screen or menu
- Create a program with: name, duration (4/8/12/16 weeks), training days per week
- Each week has assigned workout days — each day references a gym template
- Each day includes progression rules for key exercises (e.g., "+2.5kg per week on Squat")

**Program Execution:**
- Dashboard shows "Today's Workout" card when a program day is scheduled: "Push Day — Week 3, Day 1"
- One-tap start opens the gym session pre-loaded with the planned exercises and target weights
- Target weights are calculated from the progression rules and previous session data
- After completing the session, the program auto-advances to the next day
- If a user misses a day, they can skip it or reschedule the remaining days

**Progressive Overload Logic:**
- Linear progression: fixed weight increase per week (e.g., +2.5kg)
- Percentage progression: increase by X% per week
- RPE-based progression: if last session RPE < target, increase weight next time
- Deload weeks: auto-reduce weights by a configurable percentage (default 10%) every 4th week

**Program Tracking:**
- Progress bar showing current position in the program (e.g., "Week 3 of 12")
- Adherence rate: completed sessions / planned sessions
- Volume trend across weeks (did you actually progress?)
- Option to extend, restart, or end a program early

**Pre-Built Programs (optional):**
- Starter templates: "5x5 Strength", "Push/Pull/Legs", "Upper/Lower Split", "Full Body 3x"
- Users can duplicate and customize pre-built programs

### Data Model

```sql
-- Program definition
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  name TEXT NOT NULL,
  duration_weeks INT NOT NULL,
  days_per_week INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, paused, abandoned
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each workout day in the program
CREATE TABLE program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_number INT NOT NULL, -- 1-7 (Monday-Sunday)
  template_id UUID REFERENCES gym_templates(id),
  notes TEXT,
  UNIQUE (program_id, week_number, day_number)
);

-- Progression rules per exercise in a program
CREATE TABLE program_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id),
  progression_type TEXT NOT NULL, -- 'linear', 'percentage', 'rpe_based'
  increment_value NUMERIC, -- kg or % depending on type
  deload_week_interval INT DEFAULT 4,
  deload_percentage NUMERIC DEFAULT 10
);

-- Track which day the user is currently on
CREATE TABLE program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  current_week INT NOT NULL DEFAULT 1,
  current_day_index INT NOT NULL DEFAULT 0,
  completed_days INT NOT NULL DEFAULT 0,
  total_days INT NOT NULL,
  UNIQUE (program_id, user_id)
);
```

### UI Screens

1. **Programs List** — all programs with status badges (active/completed/paused)
2. **Program Detail** — weekly calendar grid showing all planned days, progress bar
3. **Create/Edit Program** — week-by-week template assignment, progression setup
4. **Today's Workout Card** — dashboard widget showing next scheduled workout

---

## Feature 2: Exercise Progress Charts

### Overview

Per-exercise line graphs showing strength and volume progression over time. Visualize how you've improved on any exercise.

### How It Works

**Accessing Charts:**
- From exercise history (tap an exercise in the library or session history)
- From a dedicated "Progress" tab in the gym section
- Search/filter to find any exercise

**Chart Types:**

1. **Estimated 1RM Chart (Primary)**
   - Line chart with date on X-axis, estimated 1RM on Y-axis
   - Each data point = best estimated 1RM from that session
   - Formula: Epley `1RM = weight × (1 + reps / 30)`
   - For single-rep sets, 1RM = the actual weight lifted
   - Trend line overlay showing overall direction

2. **Total Volume Chart**
   - Bar or line chart showing total volume per session
   - Volume = sum of (weight × reps) across all sets for that exercise
   - Useful for exercises where you chase volume, not max weight

3. **Max Weight Chart**
   - Simple line showing the heaviest weight used per session
   - Best for tracking raw strength on compounds

**Time Range Selection:**
- Segmented control: 1M / 3M / 6M / 1Y / All
- Default to 3M

**Interactivity:**
- Tap a data point to see session details: date, all sets (weight × reps @ RPE)
- Pinch to zoom on a time range
- PR markers: star icon on data points that were personal records at the time

**Comparison Mode:**
- Select two exercises to overlay on the same chart
- Useful for tracking balance (e.g., bench press vs barbell row)
- Normalized to percentage of max for fair comparison

### Data Source

No new tables needed. Query from existing data:

```sql
SELECT
  s.created_at,
  gs.weight,
  gs.reps,
  gs.rpe,
  gs.weight * (1 + gs.reps::numeric / 30) AS estimated_1rm
FROM gym_sets gs
JOIN gym_session_exercises gse ON gs.session_exercise_id = gse.id
JOIN sessions s ON gse.session_id = s.id
WHERE gse.exercise_id = $exercise_id
  AND s.user_id = auth.uid()
ORDER BY s.created_at;
```

### UI Screens

1. **Exercise Progress Page** — chart + time range selector + data point list below
2. **Comparison View** — dual-exercise overlay chart
3. **Exercise detail enhancement** — add a "View Progress" button to existing exercise history

---

## Feature 3: Personal Records (PR) System

### Overview

Automatic detection and celebration of personal bests across gym exercises, activities, and habits. Tracks PRs over time and awards visual badges.

### How It Works

**PR Detection — Gym:**
- After each set is logged, compare against previous best for that exercise + user
- PR categories per exercise:
  - **Heaviest Single** — max weight for 1 rep
  - **Best Estimated 1RM** — highest Epley 1RM from any set
  - **Most Reps at Weight** — e.g., "12 reps at 80kg" beats previous "10 reps at 80kg"
  - **Most Volume in Session** — total weight × reps across all sets of that exercise in one session
- When a PR is detected during a session, show an animated banner: "New PR! Bench Press — 102.5kg estimated 1RM"
- Confetti animation (reuse habit completion confetti)
- The set that broke the PR gets a trophy icon in the session log

**PR Detection — Activities:**
- **Fastest pace** for standard distances: 1km, 5km, 10km, half marathon, marathon
- **Longest distance** in a single session
- **Longest duration** in a single session
- **Most elevation gain** in a single session
- **Most steps** in a single session
- Detected at session completion, not during (GPS data finalized at end)

**PR Detection — Habits:**
- **Longest streak** — tracked automatically from habit_logs
- **Highest weekly completion rate** — percentage of target frequency met

**PR History Page:**
- Chronological list of all PRs with filters by category (gym/activity/habit)
- Each PR shows: exercise/activity name, new value, previous value, improvement delta, date
- Grouped by time period: "This Week", "This Month", "Earlier"

**PR Notifications:**
- In-session animation for gym PRs (immediate)
- End-of-session summary for activity PRs
- Weekly digest notification: "You hit 3 new PRs this week!"

### Data Model

```sql
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  category TEXT NOT NULL, -- 'gym', 'activity', 'habit'
  pr_type TEXT NOT NULL, -- 'heaviest_single', 'best_1rm', 'most_reps_at_weight', 'most_volume', 'fastest_pace_1k', 'longest_distance', 'longest_streak', etc.
  exercise_id UUID REFERENCES gym_exercises(id),
  activity_id UUID REFERENCES activities(id),
  habit_id UUID REFERENCES habits(id),
  value NUMERIC NOT NULL, -- the record value
  previous_value NUMERIC, -- what it beat
  session_id UUID REFERENCES sessions(id),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pr_user_category ON personal_records(user_id, category);
CREATE INDEX idx_pr_user_exercise ON personal_records(user_id, exercise_id);
```

### UI Screens

1. **PR celebration overlay** — animated banner during gym session
2. **PR history page** — filterable list of all PRs
3. **Exercise PR badge** — trophy icon on exercises that hold current PRs
4. **Session summary PR section** — list PRs hit during completed session

---

## Feature 4: Body Measurements Tracking

### Overview

Track body measurements beyond weight — chest, waist, hips, arms, thighs, neck, body fat percentage. Includes visual body diagram, trend charts, and before/after photo comparison.

### How It Works

**Logging Measurements:**
- "Add Measurement" page with a list of body parts: neck, shoulders, chest, left bicep, right bicep, waist, hips, left thigh, right thigh, left calf, right calf
- Numeric input per body part (in cm or inches based on user's unit preference)
- Optional body fat percentage field (manual entry)
- Date picker (defaults to today)
- Optional notes field
- Don't need to fill every body part — only log what you measured

**Body Diagram (optional visual):**
- Simple body silhouette with tappable hotspots for each body part
- Tap a hotspot to enter the measurement for that part
- Color-coded: green = recently measured, grey = no data

**Trend Charts:**
- Per-body-part line chart showing measurements over time
- Same chart component as exercise progress charts
- Time range selector: 1M / 3M / 6M / 1Y / All
- Overlay body fat % trend if available

**Date Comparison:**
- Pick two dates and see all measurements side by side in a table
- Delta column shows change with color coding (green for decrease in waist, green for increase in biceps — configurable per body part whether increase is good or bad)
- Arrow indicators (up/down)

**Progress Photo Pairing:**
- When logging measurements, optionally attach a front/side/back photo
- Photos stored in Supabase storage, linked to the measurement date
- Before/after comparison: slider that overlays two photos, drag divider left/right to compare

**Body Composition Calculators:**
- BMI calculator: weight / (height in meters)^2
- Navy body fat estimate: uses neck, waist, hip measurements + height + gender
- Results shown as informational cards below the measurement form

### Data Model

```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL,
  body_part TEXT NOT NULL, -- 'neck', 'shoulders', 'chest', 'left_bicep', 'right_bicep', 'waist', 'hips', 'left_thigh', 'right_thigh', 'left_calf', 'right_calf'
  value NUMERIC NOT NULL, -- in cm (converted from inches on client if needed)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, body_part)
);

CREATE TABLE body_fat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL,
  body_fat_percentage NUMERIC NOT NULL,
  method TEXT DEFAULT 'manual', -- 'manual', 'navy_formula', 'caliper'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE measurement_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  angle TEXT NOT NULL, -- 'front', 'side', 'back'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date);
```

### UI Screens

1. **Measurements List** — grouped by date, showing all body parts measured that day
2. **Add Measurement** — form with body part fields + photo capture
3. **Body Part Detail** — trend chart for a single body part
4. **Date Comparison** — side-by-side table for two selected dates
5. **Photo Comparison** — before/after slider view

---

## Feature 5: Workout Calendar / Schedule Planner

### Overview

A calendar view showing past sessions and future planned workouts. Users can plan ahead by assigning templates to future dates and track adherence.

### How It Works

**Monthly Calendar View:**
- Full month grid with colored dots on each day indicating activity:
  - Blue dot = gym session
  - Green dot = activity session
  - Orange dot = habit (all completed)
  - Grey dot = rest day (nothing planned or completed)
  - Outlined dot = planned but not yet completed
- Multiple dots per day if multiple session types occurred
- Swipe left/right to change months

**Day Detail:**
- Tap a day to see: completed sessions (gym, activity, habits) and planned sessions
- Each item shows type, name, duration/stats
- Tap to navigate to the full session detail

**Planning Mode:**
- Tap a future date to add a planned session
- Select from gym templates or activity templates
- Set time of day (morning/afternoon/evening)
- Option to set a push notification reminder for the planned session

**Recurring Schedules:**
- "Repeat weekly" option: "Every Monday = Push Day, every Wednesday = Pull Day, every Friday = Legs"
- Recurring schedules auto-populate future dates
- Individual occurrences can be modified without affecting the pattern
- Recurring schedules can be paused or deleted

**Weekly View (alternative layout):**
- 7-column view showing the current week
- Each column shows the day's planned and completed sessions as stacked cards
- Drag planned sessions between days to reschedule

**Adherence Stats:**
- "This week: 4/5 planned sessions completed"
- Monthly adherence percentage
- Streak of weeks with 100% adherence

### Data Model

```sql
CREATE TABLE planned_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL,
  session_type TEXT NOT NULL, -- 'gym', 'activity'
  template_id UUID, -- references gym_templates or activity_templates
  template_name TEXT, -- denormalized for display
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening'
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'completed', 'skipped'
  completed_session_id UUID REFERENCES sessions(id),
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ... 6=Saturday
  session_type TEXT NOT NULL,
  template_id UUID,
  template_name TEXT,
  time_of_day TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week, template_id)
);

CREATE INDEX idx_planned_sessions_user_date ON planned_sessions(user_id, date);
```

### UI Screens

1. **Calendar Page** — monthly grid with activity dots + day detail bottom sheet
2. **Plan Session Modal** — template picker + date + time of day + reminder toggle
3. **Recurring Schedule Editor** — weekday grid for assigning recurring templates
4. **Weekly View** — alternative card-based layout

---

## Feature 6: Nutrition / Meal Logging

### Overview

Basic calorie and macro tracking. Quick-log meals, scan barcodes, track water intake, and see daily nutrition summaries alongside workout data.

### How It Works

**Quick Meal Logging:**
- "Log Meal" button on dashboard or dedicated nutrition tab
- Fields: meal name (free text), meal type (breakfast/lunch/dinner/snack), calories, protein (g), carbs (g), fat (g)
- All macro fields optional — users can log just calories if they prefer
- Save as favorite for quick re-logging (e.g., "My usual oatmeal")
- Meal photo option (camera or library)

**Barcode Scanner:**
- Scan product barcode using device camera
- Look up nutrition data from OpenFoodFacts API (free, no API key required)
- Pre-fill meal name and macros from the scan result
- Adjust serving size (default per 100g, adjust to actual portion)
- Save scanned items to a personal food database for offline re-use

**Favorites / Recent Meals:**
- "Favorites" tab shows saved meals for quick one-tap logging
- "Recent" tab shows last 20 logged meals
- Tap to re-log with the same macros (adjust portion if needed)

**Daily Nutrition Summary:**
- Donut/ring chart showing macro breakdown: protein (blue), carbs (yellow), fat (red)
- Calories consumed vs daily target (horizontal progress bar)
- Macro targets shown as both grams and percentage of total calories
- Meal breakdown list below the chart

**Water Intake Tracker:**
- Quick-add buttons: +250ml, +500ml, +1L
- Daily total shown as a fill-level indicator (glass icon filling up)
- Daily water target (default 2.5L, configurable)
- Water log entries are timestamped for tracking distribution through the day

**Weekly Nutrition Overview:**
- Bar chart: daily calories for the past 7 days with target line overlay
- Average macros for the week
- Day-over-day comparison

**Feed Integration:**
- Daily nutrition summary card appears in the feed (shows total calories + macro split)
- Only appears if at least one meal was logged that day

### Data Model

```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  serving_size_g NUMERIC,
  photo_url TEXT,
  barcode TEXT,
  is_favorite BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- NULL = global, non-null = user-specific
  barcode TEXT,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  amount_ml INT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  daily_calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  water_ml INT DEFAULT 2500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_meals_user_date ON meals(user_id, logged_at);
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, logged_at);
```

### UI Screens

1. **Nutrition Dashboard** — daily summary with macro ring chart, calorie bar, water level
2. **Log Meal** — form with name/type/macros/photo + barcode scan button
3. **Favorites & Recent** — tabbed list for quick re-logging
4. **Barcode Scanner** — camera view with scan overlay
5. **Weekly Overview** — 7-day calorie bar chart with target line
6. **Nutrition Targets Settings** — configure daily calorie/macro/water goals

---

## Feature 7: Achievement / Badge System

### Overview

Gamification layer that awards badges for milestones across all app features. Drives engagement through visual progress and collectible achievements.

### How It Works

**Achievement Categories:**

1. **Consistency**
   - "First Steps" — Complete your first workout
   - "One Week Warrior" — Work out 7 days in a row
   - "Monthly Dedication" — Work out 30 days in a row
   - "Century Club" — Complete 100 workouts
   - "Year of Iron" — Work out every week for 52 weeks
   - "Unstoppable" — 365-day workout streak

2. **Strength**
   - "First Plate" — Lift 60kg (one plate per side) on any barbell exercise
   - "Two Plates" — Lift 100kg on any barbell exercise
   - "Triple Digits" — Hit 100kg estimated 1RM on any exercise
   - "Volume Machine" — Accumulate 10,000kg total volume in a single session
   - "PR Hunter" — Set 10 personal records
   - "PR Collector" — Set 50 personal records

3. **Cardio / Activity**
   - "First Kilometer" — Complete a 1km activity
   - "5K Finisher" — Complete a 5km run
   - "10K Club" — Complete a 10km run
   - "Half Marathon" — Complete a 21.1km run
   - "Marathon" — Complete a 42.2km run
   - "Century Rider" — Cover 100km total distance
   - "Around the World" — Cover 1000km total distance

4. **Habits**
   - "Habit Former" — Complete a habit 7 days in a row
   - "Habit Master" — Maintain a 30-day habit streak
   - "Habitual" — Have 5 active habits at once
   - "Perfect Week" — Complete all habits every day for a full week

5. **Explorer**
   - "Exercise Explorer" — Try 20 different exercises
   - "Activity Explorer" — Log 5 different activity types
   - "Feature Tester" — Use every main app feature at least once
   - "Template Builder" — Create 5 workout templates

6. **Social**
   - "Sharer" — Share your first workout card
   - "Connected" — Add your first friend
   - "Influencer" — Share 10 workout cards

**Tier System:**
- Each achievement has 4 tiers: Bronze / Silver / Gold / Diamond
- Tiers have progressively harder targets (e.g., streak: 7 / 30 / 100 / 365 days)
- Each tier has a distinct visual treatment (color + icon style)

**Unlock Experience:**
- When an achievement is unlocked, show a full-screen overlay with the badge animation
- Badge slides in with a glow effect and tier color
- Sound effect on unlock
- "Share" button on the unlock screen to share the badge

**Achievement Profile Page:**
- Grid of all badges: earned ones are colorful, unearned ones are greyed silhouettes
- Tap a badge to see description, requirements, and progress toward next tier
- Progress bar showing X/Y toward the next tier
- Total achievement score (points per badge × tier multiplier)

**Background Checking:**
- Achievements are checked asynchronously after each session completion, habit log, or relevant action
- Checking logic runs on the client side by querying aggregated data
- Newly unlocked achievements are queued and shown one at a time

### Data Model

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'consistency', 'strength', 'cardio', 'habits', 'explorer', 'social'
  icon_name TEXT NOT NULL,
  tiers JSONB NOT NULL, -- [{ "tier": "bronze", "target": 7, "points": 10 }, ...]
  criteria_type TEXT NOT NULL, -- 'workout_streak', 'total_workouts', 'max_weight', 'total_distance', etc.
  criteria_key TEXT, -- optional exercise_id or activity_type filter
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  current_tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'diamond'
  current_value NUMERIC NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id, current_tier)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
```

### UI Screens

1. **Achievements Page** — badge grid with category tabs, earned vs locked
2. **Achievement Detail** — description, tier progress, unlock date
3. **Unlock Overlay** — full-screen celebration animation
4. **Profile Badges Section** — showcase top badges on user profile

---

## Feature 8: Smart Rest Timer with Auto-Start

### Overview

Intelligent rest timer that automatically starts between gym sets, with duration adjusted based on exercise type and exertion level.

### How It Works

**Auto-Start Behavior:**
- When a gym set is marked as complete, the rest timer automatically begins counting down
- The timer appears as a floating overlay at the bottom of the gym session screen
- Does not interrupt the UI — user can continue browsing exercises, adding notes, etc.
- Toggle on/off in gym settings (off by default to avoid surprising users)

**Default Rest Durations by Exercise Type:**
- Compound barbell exercises (squat, bench, deadlift, OHP): 180 seconds (3 min)
- Compound dumbbell/machine exercises: 120 seconds (2 min)
- Isolation exercises: 90 seconds
- Bodyweight exercises: 60 seconds
- Exercise type is determined from the existing equipment and muscle group metadata

**RPE-Based Adjustment:**
- If the logged set had RPE >= 9: add 30 seconds to the default rest time
- If the logged set had RPE >= 9.5: add 60 seconds
- If RPE <= 6: subtract 30 seconds (minimum 30 seconds)
- Only applies when RPE is actually logged for that set

**Per-Exercise Overrides:**
- Long-press the rest timer to open settings for the current exercise
- Set a custom rest duration that overrides the default for this exercise
- Saved per-exercise: "Always rest 4 minutes after Barbell Squat"
- Stored in a `exercise_rest_settings` table

**Timer UI:**
- Circular progress ring showing remaining time
- Large countdown text in the center
- Quick-adjust buttons: -30s / +30s
- "Skip" button to dismiss the timer early
- Haptic feedback when timer reaches 0
- Configurable sound alert (short beep, long tone, or silent)

**Settings:**
- Enable/disable auto-start (default: off)
- Default rest duration per exercise category (editable)
- RPE adjustment on/off
- Sound selection (beep, tone, vibration only, silent)
- Auto-start delay: 0s, 2s, 5s after set completion (to avoid accidental triggers)

### Data Model

```sql
CREATE TABLE exercise_rest_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id),
  rest_duration_seconds INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);
```

Most settings stored in existing `gymSettingsStore` (Zustand with AsyncStorage persistence):
- `autoStartRestTimer: boolean`
- `restTimerDefaults: { compound: 180, isolation: 90, bodyweight: 60 }`
- `rpeAdjustmentEnabled: boolean`
- `restTimerSound: 'beep' | 'tone' | 'vibration' | 'silent'`
- `autoStartDelay: 0 | 2 | 5`

### UI Changes

1. **Floating rest timer overlay** — circular countdown during gym session
2. **Gym settings page** — new section for rest timer auto-start configuration
3. **Per-exercise override** — long-press timer to set custom duration

---

## Feature 9: Supersets & Circuit Training Mode

### Overview

Enhanced superset UI for grouping exercises in gym sessions, plus a dedicated circuit training mode with timed work/rest intervals.

### How It Works

**Superset Builder:**
- In an active gym session, select 2-3 exercises and tap "Group as Superset"
- Grouped exercises are visually connected with a bracket and labeled A1/A2/A3
- When logging a superset, the app guides you through alternating sets:
  - Log set of Exercise A → rest timer → log set of Exercise B → rest timer → back to A
- Rest timer between exercises in a superset is shorter (default: 30 seconds between exercises, full rest after completing one round)
- Superset grouping is saved in the session and appears in session history

**Circuit Mode:**
- Separate "Start Circuit" option in the gym session or as a standalone session type
- Define the circuit:
  - Select exercises in order
  - Set work time per exercise (default: 40 seconds)
  - Set rest time between exercises (default: 20 seconds)
  - Set rest time between rounds (default: 60 seconds)
  - Set number of rounds (default: 3)
- Circuit timer runs automatically:
  - Full-screen display showing: current exercise name, work/rest countdown, current round
  - Color coding: green during work, red during rest
  - Audio cue at transitions (beep to start work, different beep for rest)
  - 3-2-1 countdown before each transition
- Exercises within the circuit can be weight-based (log weight after each round) or bodyweight (just timed)

**AMRAP Mode (As Many Rounds As Possible):**
- Set a total time limit (e.g., 20 minutes)
- Circuit loops continuously until time expires
- Counter shows completed rounds + partial round progress
- Final summary shows total rounds and time per round

**EMOM Mode (Every Minute On the Minute):**
- Set exercises and total minutes
- New minute starts automatically — whatever time is left after completing the exercise is rest
- Encourages efficiency: faster completion = more rest
- Shows elapsed time within the minute and total minutes completed

**Post-Circuit Summary:**
- Total rounds completed
- Time per round (average and per-round breakdown)
- Total work time vs rest time
- Exercises completed with weights used

**Templates:**
- Save circuit configurations as templates for reuse
- Separate from gym templates — "Circuit Templates" section
- Include exercise order, timing, and round configuration

### Data Model Changes

```sql
-- Add superset grouping to existing gym_session_exercises
ALTER TABLE gym_session_exercises ADD COLUMN superset_group TEXT; -- e.g., 'A', 'B', 'C' — NULL = not in a superset

-- Circuit session configuration
CREATE TABLE circuit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'circuit', 'amrap', 'emom'
  work_seconds INT NOT NULL DEFAULT 40,
  rest_seconds INT NOT NULL DEFAULT 20,
  rest_between_rounds_seconds INT DEFAULT 60,
  total_rounds INT, -- NULL for AMRAP (time-based)
  time_limit_seconds INT, -- for AMRAP mode
  completed_rounds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Circuit templates
CREATE TABLE circuit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  work_seconds INT NOT NULL DEFAULT 40,
  rest_seconds INT NOT NULL DEFAULT 20,
  rest_between_rounds_seconds INT DEFAULT 60,
  total_rounds INT,
  time_limit_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE circuit_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES circuit_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES gym_exercises(id),
  sort_order INT NOT NULL,
  is_timed BOOLEAN DEFAULT false -- true = bodyweight/timed, false = weight-based
);
```

### UI Screens

1. **Superset grouping UI** — bracket visual in gym session, alternating set flow
2. **Circuit Builder** — exercise selector + timing configuration
3. **Circuit Timer** — full-screen countdown with exercise name, round counter
4. **AMRAP Timer** — total time countdown with round counter
5. **EMOM Timer** — minute-by-minute display
6. **Circuit Summary** — post-circuit stats
7. **Circuit Templates** — list and manage saved circuits

---

## Feature 10: Sleep Tracking (Manual)

### Overview

Simple manual sleep logging to correlate rest quality with workout performance. No wearable required — just log bedtime, wake time, and sleep quality.

### How It Works

**Logging Sleep:**
- "Log Sleep" available from dashboard or health section
- Bedtime picker: scroll wheel for hour/minute (defaults to previous night's bedtime)
- Wake time picker: same format (defaults to current time if logging in the morning)
- Auto-calculated duration shown between the two pickers
- Sleep quality rating: 1-5 stars (tap to rate)
- Optional notes: free text (e.g., "woke up twice", "bad dreams", "felt great")
- Quick log: if you just want duration + quality, skip the exact times

**Sleep Dashboard:**
- Last night's sleep card: duration, quality rating, bedtime/wake time
- Weekly bar chart: one bar per night, colored by quality (red = 1-2, yellow = 3, green = 4-5)
- Average sleep duration line overlaid on the bar chart
- Sleep target line (default: 8 hours, configurable)
- Sleep consistency score: standard deviation of bedtime over the past 14 days — lower = more consistent

**Correlation Insights:**
- Compare sleep quality with next-day workout performance
- "On days after 7+ hours of sleep, your average gym volume was X kg vs Y kg on days after less than 7 hours"
- "Your best PRs were set after nights rated 4+ stars"
- Simple comparison cards — no complex ML, just aggregate queries
- Only shown if enough data exists (minimum 14 days of both sleep + workout data)

**Reminders:**
- Optional bedtime reminder notification: "Time to wind down — your target bedtime is 22:30"
- Configurable time (e.g., 30 minutes before target bedtime)
- Morning reminder to log sleep if not yet logged today

**Dashboard Integration:**
- "Last Night" card on the main dashboard showing duration + quality
- Appears in the feed as a daily sleep summary card

### Data Model

```sql
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL, -- the date of the morning (wake date)
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL,
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, date);
```

### UI Screens

1. **Log Sleep** — bedtime/wake time pickers, duration display, quality stars, notes
2. **Sleep Dashboard** — weekly bar chart, consistency score, averages
3. **Correlation Cards** — sleep vs performance insights
4. **Sleep Settings** — target hours, bedtime reminder configuration

---

## Feature 11: Social Feed & Friend Activity

### Overview

Complete the existing friends system with a social feed showing friend workouts, reactions, comments, leaderboards, and challenges.

### How It Works

**Social Feed:**
- Dedicated "Friends" or "Social" tab showing a feed of friend activities
- Feed items include: completed gym sessions, completed activities, PRs achieved, streak milestones, achievements unlocked
- Each feed item shows: friend's name + avatar, activity type, key stats, timestamp
- Privacy controls determine what appears — users choose what to share

**Reactions:**
- Tap a reaction button on any friend's feed item
- Quick reactions: thumbs up, fire, clap, muscle, heart
- Each user can add one reaction per feed item (tap again to change)
- Reaction counts shown below each item (e.g., "3 reactions")

**Comments:**
- Tap to expand comments section on any feed item
- Text-only comments (no media to keep it simple)
- Chronological order, newest at bottom
- Delete your own comments

**Privacy Controls (in settings):**
- "Share with friends" toggle per feature: gym sessions, activities, habits, PRs, achievements
- Default: everything shared
- Individual session override: after completing a session, toggle "Share to friends" on/off
- "Who can see my activity" — All friends / Close friends only / Nobody

**Leaderboards:**
- Weekly leaderboards among friends:
  - Total workout volume (kg)
  - Total distance (km)
  - Workout count
  - Longest streak
  - Most PRs
- Leaderboard resets every Monday
- Push notification: "You're #1 in volume this week!" or "Friend just passed you in distance"

**Challenges:**
- Challenge a friend to a specific goal with a deadline
- Challenge types: "Most km this week", "Most volume this week", "First to hit X workouts"
- Both participants must accept the challenge
- Live progress tracking: see both participants' current progress
- Winner announced at deadline with a congratulatory notification
- Challenge history showing past results

**Notifications:**
- Push notification when a friend reacts to your session
- Push notification when a friend comments on your session
- Push notification for challenge invites, progress, and results
- Configurable: enable/disable social notifications separately

### Data Model

```sql
-- Reactions on feed items
CREATE TABLE social_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'thumbs_up', 'fire', 'clap', 'muscle', 'heart'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feed_item_id)
);

-- Comments on feed items
CREATE TABLE social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Friend challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  opponent_id UUID NOT NULL REFERENCES users(id),
  challenge_type TEXT NOT NULL, -- 'most_distance', 'most_volume', 'most_workouts', 'target_workouts'
  target_value NUMERIC, -- for target-based challenges
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'declined'
  creator_progress NUMERIC DEFAULT 0,
  opponent_progress NUMERIC DEFAULT 0,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Privacy settings per user
CREATE TABLE social_privacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  share_gym BOOLEAN DEFAULT true,
  share_activities BOOLEAN DEFAULT true,
  share_habits BOOLEAN DEFAULT true,
  share_prs BOOLEAN DEFAULT true,
  share_achievements BOOLEAN DEFAULT true,
  visibility TEXT DEFAULT 'all_friends', -- 'all_friends', 'close_friends', 'nobody'
  UNIQUE (user_id)
);

CREATE INDEX idx_social_reactions_feed ON social_reactions(feed_item_id);
CREATE INDEX idx_social_comments_feed ON social_comments(feed_item_id);
CREATE INDEX idx_challenges_users ON challenges(creator_id, opponent_id);
```

### UI Screens

1. **Social Feed** — scrollable list of friend activities with reaction buttons
2. **Comments Sheet** — bottom sheet with comment list and input
3. **Leaderboards** — weekly rankings among friends with category tabs
4. **Challenge Detail** — progress comparison between participants
5. **Create Challenge** — friend picker + type + deadline
6. **Privacy Settings** — toggles for what to share and visibility level

---

## Feature 12: Data Export & Backup

### Overview

Export all user data in CSV, JSON, or PDF format. Supports selective exports, date ranges, and automated monthly backups.

### How It Works

**Export Options:**
- Access from Settings > Data & Privacy > Export Data
- Select data types to include (checkboxes):
  - Gym sessions (exercises, sets, reps, weight, RPE)
  - Activities (type, distance, pace, route GPX)
  - Habits (definitions + completion logs)
  - Weight entries
  - Body measurements
  - Notes
  - Sleep logs
- Date range picker: "Last 30 days", "Last 3 months", "Last year", "All time", "Custom range"

**Export Formats:**

1. **CSV Export:**
   - One file per data type (e.g., `gym_sessions.csv`, `activities.csv`, `habits.csv`)
   - Bundled into a single ZIP file
   - Column headers match the data fields
   - Dates in ISO 8601 format
   - UTF-8 encoding

2. **JSON Export:**
   - Single JSON file with nested structure
   - Full data fidelity (all fields, relationships, metadata)
   - Suitable for backup/restore
   - Schema version field for forward compatibility

3. **PDF Report:**
   - Formatted summary document with sections per data type
   - Includes mini charts: volume trend, distance trend, weight trend
   - Summary statistics: total workouts, total distance, PRs, longest streaks
   - Styled with app branding
   - "Year in Review" style report option

**Export Delivery:**
- Generated on-device (CSV/JSON) or via Supabase Edge Function (PDF)
- Shared via system share sheet: email, save to Files, AirDrop, cloud storage
- Progress indicator during generation

**Automated Monthly Backup:**
- Toggle in settings: "Auto-backup monthly"
- Generates a full JSON export on the 1st of each month
- Saves to device storage (configurable location)
- Push notification: "Your monthly backup is ready"

**Import / Restore:**
- Import from a JSON backup file
- File picker to select the backup
- Preview what will be imported (counts per data type)
- Conflict resolution: skip duplicates (based on created_at + type)
- Confirmation before proceeding

**GDPR Compliance:**
- "Download all my data" button — exports everything with no date filter
- "Delete all my data" button — with multi-step confirmation
- Both accessible from Settings > Data & Privacy

### Implementation Notes

- CSV generation uses a lightweight CSV serializer on the client
- JSON export queries all tables via Supabase and serializes to file
- PDF generation uses a Supabase Edge Function with a PDF library (e.g., jsPDF)
- GPX export for activities: convert GPS points to standard GPX XML format
- Large exports use streaming/chunking to avoid memory issues

### UI Screens

1. **Export Settings** — data type checkboxes, date range, format selection
2. **Export Progress** — progress bar during generation
3. **Export Complete** — share sheet with the generated file
4. **Import Page** — file picker, preview, confirmation
5. **Auto-Backup Settings** — toggle, frequency, storage location

---

## Feature 13: Custom Dashboard Widgets

### Overview

Configurable dashboard with drag-and-drop widgets. Users choose which metrics and quick actions appear on their home screen.

### How It Works

**Available Widgets:**

| Widget | Size | Content |
|--------|------|---------|
| Today's Workout | 2x1 | Next planned workout name + "Start" button |
| Weekly Volume | 2x1 | Bar chart of gym volume for the last 7 days |
| Current Streaks | 1x1 | Longest active habit streak count |
| Weight Trend | 2x1 | Mini line chart of last 14 weight entries |
| Step Count | 1x1 | Today's steps with circular progress ring |
| Sleep Last Night | 1x1 | Duration + quality stars |
| Quick Start | 2x1 | Buttons to start gym/activity/habit session |
| PR Ticker | 2x1 | Scrolling ticker of recent PRs |
| Calendar Preview | 2x2 | Mini 7-day calendar with activity dots |
| Nutrition Summary | 2x1 | Today's calories + macro breakdown bar |
| Habit Checklist | 2x2 | Today's habits with completion toggles |
| Active Timer | 1x1 | Running timer countdown (if active) |

**Widget Sizes:**
- 1x1: small square (quarter width)
- 2x1: half width, single height
- 2x2: half width, double height
- Grid is 2 columns wide

**Edit Mode:**
- Long-press the dashboard to enter edit mode (widgets jiggle like iOS home screen)
- Drag widgets to reorder
- Tap X on a widget to remove it
- Tap "+" button to open the widget picker and add new widgets
- Tap "Done" to save and exit edit mode

**Widget Picker:**
- Grid of all available widgets with preview thumbnails
- Tap to add to dashboard at the bottom
- Widgets not currently on the dashboard shown as available
- Search/filter by category

**Preset Layouts:**
- Pre-configured widget arrangements for common use cases:
  - "Gym Focus" — Today's Workout, Weekly Volume, PR Ticker, Quick Start
  - "Runner Focus" — Step Count, Calendar Preview, Quick Start, Weight Trend
  - "Balanced" — Today's Workout, Habit Checklist, Weight Trend, Quick Start
  - "Minimal" — Quick Start, Current Streaks
- Select a preset from the widget picker to replace current layout

**Data Refresh:**
- Widgets pull from React Query cache — no extra network requests
- Widgets update when the user navigates to the dashboard (query refetch)
- Active Timer widget updates in real-time

### Data Model

```sql
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  widget_layout JSONB NOT NULL DEFAULT '[]',
  -- Array of: [{ "type": "weekly_volume", "size": "2x1", "position": 0 }, ...]
  preset_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
```

Alternatively, store entirely in AsyncStorage for offline-first behavior (no DB needed).

### UI Screens

1. **Dashboard** — widget grid replacing current fixed layout
2. **Edit Mode** — jiggling widgets with drag handles and X buttons
3. **Widget Picker** — grid of available widgets with previews
4. **Preset Selector** — list of preset layouts with preview

---

## Feature 14: Stretching & Warm-up Routines

### Overview

Guided stretching and warm-up sequences with auto-advancing timers and optional voice announcements. Can be linked to gym workouts as pre/post routines.

### How It Works

**Stretch Library:**
- Library of stretches organized by body area:
  - Upper body: neck rolls, shoulder stretches, chest opener, tricep stretch, wrist circles
  - Lower body: quad stretch, hamstring stretch, hip flexor, calf stretch, ankle circles
  - Full body: cat-cow, child's pose, downward dog, world's greatest stretch
  - Sport-specific: runner's lunge, IT band stretch, swimmer's shoulder
- Each stretch entry: name, description (text instructions), target muscles, duration (seconds), difficulty (beginner/intermediate/advanced)
- Translations for EN and FI

**Custom Routine Builder:**
- Create a routine by selecting stretches from the library
- Drag to reorder
- Adjust duration per stretch (override default)
- Set rest time between stretches (default: 5 seconds)
- Name and save the routine

**Pre-Built Routines:**
- "Pre-Squat Warm-up" — hip circles, bodyweight squats, hip flexor stretch, ankle mobility (5 min)
- "Post-Run Cool Down" — quad stretch, hamstring, calf, hip flexor, pigeon pose (7 min)
- "Morning Mobility" — cat-cow, world's greatest stretch, shoulder circles, hip circles (10 min)
- "Desk Worker Reset" — neck rolls, chest opener, hip flexor, hamstring, wrist stretch (5 min)
- "Upper Body Warm-up" — arm circles, band pull-aparts, shoulder dislocates, wrist circles (5 min)

**Routine Execution:**
- Full-screen display showing:
  - Current stretch name (large text)
  - Duration countdown (circular progress ring)
  - "Next up: [next stretch name]" preview
  - Progress indicator: "3 of 8 stretches"
- Auto-advances to next stretch when timer reaches 0
- Brief rest screen between stretches (configurable: 5/10/15 seconds)
- Audio cue at transition (short chime)
- Optional voice announcements via text-to-speech: "Next: Hamstring stretch, 30 seconds"
- Pause/resume button
- Skip button to jump to next stretch

**Gym Integration:**
- In gym template settings, optionally link a warm-up routine and/or cool-down routine
- When starting a gym session from a template, prompt: "Start warm-up first?" → runs the linked routine before the workout
- After completing the gym session, prompt: "Do your cool-down?" → runs the linked routine

**Tracking:**
- Log completed stretching sessions (date, routine name, duration)
- Weekly count: "You stretched 3 times this week"
- Appears in the feed as a stretching session card

### Data Model

```sql
CREATE TABLE stretches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_muscles TEXT[], -- e.g., ['hamstrings', 'hip_flexors']
  body_area TEXT NOT NULL, -- 'upper_body', 'lower_body', 'full_body'
  default_duration_seconds INT NOT NULL DEFAULT 30,
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  is_system BOOLEAN DEFAULT false, -- true = pre-built, false = user-created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stretch_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stretch_id UUID NOT NULL REFERENCES stretches(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE (stretch_id, language)
);

CREATE TABLE stretch_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- NULL for system routines
  name TEXT NOT NULL,
  description TEXT,
  rest_between_seconds INT DEFAULT 5,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stretch_routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES stretch_routines(id) ON DELETE CASCADE,
  stretch_id UUID NOT NULL REFERENCES stretches(id),
  sort_order INT NOT NULL,
  duration_override_seconds INT, -- NULL = use stretch default
  UNIQUE (routine_id, sort_order)
);

-- Link warmup/cooldown to gym templates
ALTER TABLE gym_templates ADD COLUMN warmup_routine_id UUID REFERENCES stretch_routines(id);
ALTER TABLE gym_templates ADD COLUMN cooldown_routine_id UUID REFERENCES stretch_routines(id);

-- Log completed stretching sessions
CREATE TABLE stretch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  routine_id UUID REFERENCES stretch_routines(id),
  routine_name TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### UI Screens

1. **Stretch Library** — searchable list grouped by body area
2. **Routine Builder** — drag-to-reorder stretch list with duration adjustments
3. **Routine Execution** — full-screen timer with auto-advance
4. **Pre-Built Routines** — list of system routines with description and duration
5. **Stretch History** — log of completed routines with weekly count

---

## Feature 15: Heart Rate Zone Training

### Overview

Connect a Bluetooth heart rate monitor to track HR during workouts. Display real-time HR, time-in-zone breakdown, and improved calorie calculations.

### How It Works

**Bluetooth Pairing:**
- Settings > Devices > "Connect Heart Rate Monitor"
- Scan for nearby Bluetooth LE devices broadcasting the standard Heart Rate Service (UUID 0x180D)
- Compatible with all standard HR monitors: Polar H10/H9, Garmin HRM, Wahoo TICKR, generic chest straps
- Save paired device for auto-reconnect on future sessions
- Connection status indicator in session screens

**Heart Rate Zones:**
- Calculated from max HR using the standard formula: `Max HR = 220 - age` (age from user profile)
- Or user can manually set their max HR for more accuracy
- Five zones:
  - Zone 1 (50-60% max HR): Very light — warm-up, recovery
  - Zone 2 (60-70% max HR): Light — fat burning, endurance base
  - Zone 3 (70-80% max HR): Moderate — aerobic fitness
  - Zone 4 (80-90% max HR): Hard — lactate threshold
  - Zone 5 (90-100% max HR): Maximum — VO2 max, sprints
- Colors: grey → blue → green → yellow → red

**Real-Time Display:**
- During active sessions (gym or activity), show a floating HR overlay:
  - Current BPM (large number)
  - Zone indicator (colored bar or background tint)
  - Zone name (e.g., "Zone 3 — Moderate")
  - Mini graph showing HR over the last 5 minutes
- Overlay position configurable (top, bottom, minimized)

**Post-Session Analysis:**
- Time-in-zone bar chart: horizontal bars showing minutes spent in each zone
- Average HR, max HR, min HR for the session
- HR curve over the full session (line chart with zone color bands in background)
- Calories burned recalculated using HR data (more accurate than MET-based):
  - Male: `Calories/min = (-55.0969 + 0.6309 × HR + 0.1988 × weight + 0.2017 × age) / 4.184`
  - Female: `Calories/min = (-20.4022 + 0.4472 × HR - 0.1263 × weight + 0.074 × age) / 4.184`

**Resting Heart Rate Tracking:**
- Prompt to measure resting HR: "Sit still for 60 seconds"
- Record lowest stable HR reading over 60 seconds
- Track resting HR over time (line chart) — lower = better cardiovascular fitness
- Weekly/monthly trend

**HR Recovery Metric:**
- After a hard session, measure HR at 1 minute post-exercise
- Recovery = peak HR - HR at 1 minute
- Good recovery: >20 BPM drop in 1 minute
- Track recovery metric over time as a fitness indicator

**Alerts:**
- Optional HR ceiling alert: notification/vibration when HR exceeds a threshold
- Useful for zone 2 training (stay in the fat-burning zone)
- Configurable threshold per session or as a default

### Dependencies

- `react-native-ble-plx` — Bluetooth LE communication
- Standard Heart Rate Service (0x180D) parsing
- Android: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` permissions
- iOS: Bluetooth usage description in Info.plist

### Data Model

```sql
CREATE TABLE hr_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  device_name TEXT NOT NULL,
  device_id TEXT NOT NULL, -- BLE device ID
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

CREATE TABLE session_hr_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  avg_hr INT,
  max_hr INT,
  min_hr INT,
  calories_hr_based NUMERIC,
  time_zone1_seconds INT DEFAULT 0,
  time_zone2_seconds INT DEFAULT 0,
  time_zone3_seconds INT DEFAULT 0,
  time_zone4_seconds INT DEFAULT 0,
  time_zone5_seconds INT DEFAULT 0,
  hr_data_points JSONB, -- [{ "timestamp": ..., "bpm": ... }, ...]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resting_hr_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  date DATE NOT NULL,
  bpm INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Add max_hr to user profile
ALTER TABLE users ADD COLUMN max_hr INT; -- NULL = use 220-age formula
ALTER TABLE users ADD COLUMN date_of_birth DATE; -- needed for HR calculations
```

### UI Screens

1. **Device Pairing** — BLE scanner with device list
2. **HR Overlay** — floating real-time BPM + zone during sessions
3. **Session HR Summary** — time-in-zone chart, HR curve, stats
4. **Resting HR Page** — measurement flow + trend chart
5. **HR Settings** — max HR, zones, alert threshold, overlay position

---

## Feature 16: AI Workout Suggestions

### Overview

Local intelligence that analyzes training history to suggest what to train, recommend weights, detect fatigue, and show muscle balance. All logic runs on-device using existing data — no external API calls.

### How It Works

**"What Should I Train?" Suggestions:**
- Analyze the last 7-14 days of gym sessions
- Identify muscle groups by recency of training:
  - Count days since each muscle group was last trained
  - Flag muscle groups not trained in 5+ days as "due"
- Dashboard card: "You haven't trained legs in 6 days — try your Leg Day template"
- If no template matches, suggest: "Consider training: Quads, Hamstrings, Calves"
- Accounts for the user's typical training frequency (if they usually train legs every 5 days, suggest at day 5)

**Weight Recommendations:**
- For each exercise in a session, suggest a starting weight based on:
  - Last session's performance for that exercise
  - Progressive overload logic: if last session was completed at RPE < 8, suggest +2.5kg (barbell) or +1-2kg (dumbbell)
  - If last session was RPE 9-10, suggest same weight
  - If last session was incomplete (missed reps), suggest -5%
- Shown as a subtle hint below the weight input: "Suggested: 82.5kg (based on last session: 80kg × 8 @ RPE 7)"
- User can ignore — it's a suggestion, not enforced

**Fatigue Detection:**
- Track rolling 4-week volume per muscle group
- If volume drops >15% over 2 consecutive sessions for the same exercise: show a warning
- "Your bench press volume has dropped 2 sessions in a row — consider a deload week"
- If overall session frequency drops (e.g., training 5x/week dropped to 3x/week for 2 weeks): "Training frequency dropped — are you recovering? Consider a lighter week"

**Recovery Time Estimates:**
- After a gym session, estimate recovery time per muscle group based on:
  - Number of sets targeting that muscle (more sets = longer recovery)
  - Average RPE of those sets (higher RPE = longer recovery)
  - Simple formula: `recovery_hours = base_48h + (sets_above_10 × 6h) + (avg_rpe_above_7 × 4h)`
- Show on dashboard: "Chest: recovered in ~8 hours" / "Legs: ~24 hours to full recovery"
- Color coding: red (still recovering) → yellow (almost ready) → green (fully recovered)

**Muscle Balance Radar Chart:**
- Radar/spider chart showing relative training volume across major muscle groups
- Categories: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Calves, Core
- Volume = total sets in the last 30 days
- Balanced = symmetrical chart, imbalanced = lopsided
- "Push vs Pull ratio: 1.3:1 (slightly push-dominant)"
- "Upper vs Lower ratio: 2:1 (consider more leg work)"

**Settings:**
- Toggle suggestions on/off (default: on)
- Toggle weight recommendations on/off
- Toggle fatigue warnings on/off
- These are non-intrusive — always dismissible

### Data Source

No new tables needed. All data comes from existing queries:

```sql
-- Last trained date per muscle group
SELECT gex.primary_muscle, MAX(s.created_at) AS last_trained
FROM gym_session_exercises gse
JOIN gym_exercises gex ON gse.exercise_id = gex.id
JOIN sessions s ON gse.session_id = s.id
WHERE s.user_id = auth.uid()
GROUP BY gex.primary_muscle;

-- Volume per muscle group over last 30 days
SELECT gex.primary_muscle, COUNT(gs.id) AS total_sets, SUM(gs.weight * gs.reps) AS total_volume
FROM gym_sets gs
JOIN gym_session_exercises gse ON gs.session_exercise_id = gse.id
JOIN gym_exercises gex ON gse.exercise_id = gex.id
JOIN sessions s ON gse.session_id = s.id
WHERE s.user_id = auth.uid()
  AND s.created_at > now() - interval '30 days'
GROUP BY gex.primary_muscle;
```

### UI Components

1. **Dashboard suggestion card** — "What to train today" with template shortcut
2. **Weight suggestion hint** — subtle text below weight input in gym session
3. **Fatigue warning banner** — dismissible warning during or after session
4. **Recovery status** — per-muscle-group colored indicators on dashboard
5. **Muscle balance chart** — radar chart in gym analytics section

---

## Feature 17: Dark / Light Theme Toggle

### Overview

Add a light theme option alongside the current dark theme. Users can choose dark, light, or follow system preference.

### How It Works

**Theme Options:**
- Settings > Appearance > Theme: Dark / Light / System
- "System" follows the device's current dark/light mode setting
- Default: Dark (current behavior, no change for existing users)

**Light Theme Color Palette:**
- Background: white (`#FFFFFF`) to light grey (`#F5F5F5`)
- Cards: white with subtle shadow or light grey border
- Text: dark grey (`#1A1A1A`) for primary, medium grey (`#6B7280`) for secondary
- Accent colors remain the same (blue, green, orange, red)
- Input fields: white background with grey border
- Tab bar: white background with colored active indicator
- All button styles adapt: `btn-base`, `btn-danger`, `btn-neutral` get light variants

**NativeWind Implementation:**
- Use NativeWind's built-in dark mode support: `className="bg-white dark:bg-slate-900"`
- Wrap the app with a theme provider that sets the color scheme
- All components use the `dark:` prefix for dark-mode styles (current) and base classes for light mode
- Migration path: audit all screens and add light-mode base classes where only dark classes exist currently

**Specific Adaptations:**
- Map styles: switch between Mapbox light and dark styles based on theme
- Charts: update chart colors and grid lines for light backgrounds
- Share cards: respect current theme or allow independent theme selection
- Status bar: light content on dark theme, dark content on light theme
- Navigation bar: adapt header colors

**Persistence:**
- Theme preference stored in user settings (Zustand + AsyncStorage)
- Synced to Supabase user_settings for cross-device consistency
- Applied on app launch before first render (no flash of wrong theme)

**Transition:**
- Smooth color transition when switching themes (optional, using Reanimated)
- Or instant switch (simpler, no animation)

### Implementation Steps

1. Define CSS custom properties or NativeWind theme tokens for both palettes
2. Add `dark:` prefixes to all existing styles (or refactor to use base = light)
3. Create a ThemeProvider context that reads preference and applies color scheme
4. Audit every screen for hardcoded colors (e.g., `bg-slate-900` without `dark:` prefix)
5. Update `global.css` with light-mode equivalents for all utility classes
6. Add theme setting to settings screen

---

## Feature 18: Workout Music Integration

### Overview

Control music playback from within the app during workouts. Mini player shows current track with playback controls — works with whatever music app is playing.

### How It Works

**Mini Player Bar:**
- Appears at the bottom of gym/activity session screens (above the tab bar)
- Shows: album art (small), track title, artist name
- Controls: play/pause, skip forward, skip back
- Tap to expand into a slightly larger view with volume slider
- Swipe down or tap to collapse back to mini bar
- Only visible during active sessions

**System Media Integration:**
- Uses the system media session API to read and control whatever is currently playing
- Works with any music app: Spotify, Apple Music, YouTube Music, SoundCloud, etc.
- `react-native-track-player` or `@react-native-community/audio-toolkit` for media session access
- No direct Spotify/Apple Music API integration needed — just system-level controls
- If no music is playing, the mini player is hidden

**Playlist Association (optional):**
- In gym template settings, associate a playlist name/link
- When starting a session from that template, show a prompt: "Open [playlist name] in Spotify?"
- Opens the music app with a deep link to the playlist
- Control returns to the training app, music plays in background

**BPM Matching (stretch goal):**
- During activity tracking (running/cycling), detect current pace/cadence
- Suggest tempo-matched playlists: "Your cadence is 170 SPM — try a 170 BPM playlist"
- Link to pre-curated playlists by BPM range (external links, not in-app playback)

### Implementation Notes

- Android: `MediaSession` API for reading now-playing info and sending play/pause/skip commands
- iOS: `MPNowPlayingInfoCenter` and `MPRemoteCommandCenter` for system media control
- Minimal permissions: just media session access (no microphone, no storage)
- Graceful degradation: if no media session is active, mini player simply doesn't appear

### UI Components

1. **Mini Player Bar** — compact bar with track info + play/pause/skip
2. **Expanded Player** — slightly larger with volume slider + full track info
3. **Template Playlist Setting** — link a playlist to a gym template

---

## Feature 19: Injury Log & Pain Tracker

### Overview

Track injuries, daily pain levels, and recovery progress. Provides exercise warnings and modification suggestions based on active injuries.

### How It Works

**Logging an Injury:**
- "Log Injury" from health section or settings
- Select body part from a visual body diagram (front/back view with tappable regions)
- Body parts: neck, left shoulder, right shoulder, upper back, lower back, left elbow, right elbow, left wrist, right wrist, left hip, right hip, left knee, right knee, left ankle, right ankle
- Injury type: strain, sprain, tendinitis, soreness, pain (general), fracture, other
- Severity: 1-10 scale (1 = minor discomfort, 10 = severe/can't move)
- Date of injury (defaults to today)
- Notes: free text describing the injury and circumstances
- Status: active (default) or resolved

**Daily Pain Check-In:**
- If there are active injuries, show a daily prompt: "How does your [body part] feel today?"
- Rate current pain: 1-10 scale
- Optional notes: "Better after physio", "Worse after sleeping"
- Quick log from a notification (optional daily reminder)

**Pain Trend Chart:**
- Line chart showing pain level over time for each active injury
- X-axis: days since injury, Y-axis: pain level 1-10
- Downward trend = recovering
- Flat or upward trend = not improving (prompt to see a doctor)
- Average recovery time shown based on own data

**Exercise Warnings:**
- When starting a gym session, if there are active injuries, check the exercises against the injury
- Mapping: injury body part → affected muscle groups → exercises that target those muscles
- E.g., "Right shoulder injury" → warns on: overhead press, lateral raises, bench press
- Warning icon (yellow triangle) appears on affected exercises in the session
- Tap the warning to see: "You have an active right shoulder injury (severity: 5/10). Consider reducing weight or using an alternative exercise."

**Modification Suggestions:**
- For flagged exercises, suggest alternatives:
  - "Shoulder injury: Replace Barbell Overhead Press with Landmine Press (less shoulder stress)"
  - "Knee injury: Replace Barbell Squat with Leg Press (reduced knee angle)"
- Suggestions are static/hardcoded mappings, not AI-generated
- User can dismiss warnings for individual exercises: "I know, it's fine"

**Recovery Logging:**
- Log treatments and recovery activities: ice, heat, physiotherapy, rest, medication, stretching
- Attach to a specific injury
- Timeline view showing injury events: injury date → pain logs → treatments → resolution

**Resolution:**
- Mark injury as resolved when pain consistently reaches 0-1
- Prompt: "Your [body part] pain has been 0 for 3 days — mark as resolved?"
- Resolved injuries move to history and stop triggering warnings

### Data Model

```sql
CREATE TABLE injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id),
  body_part TEXT NOT NULL,
  injury_type TEXT NOT NULL, -- 'strain', 'sprain', 'tendinitis', 'soreness', 'pain', 'fracture', 'other'
  severity INT NOT NULL CHECK (severity BETWEEN 1 AND 10),
  injury_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
  resolved_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pain_level INT NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (injury_id, date)
);

CREATE TABLE injury_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL, -- 'ice', 'heat', 'physiotherapy', 'rest', 'medication', 'stretching', 'other'
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mapping of body parts to muscle groups for exercise warnings
CREATE TABLE injury_exercise_mappings (
  body_part TEXT NOT NULL,
  muscle_group TEXT NOT NULL, -- matches gym_exercises.primary_muscle
  PRIMARY KEY (body_part, muscle_group)
);

-- Pre-populate with mappings:
-- 'left_shoulder' → 'shoulders', 'chest'
-- 'right_shoulder' → 'shoulders', 'chest'
-- 'lower_back' → 'back', 'core'
-- 'left_knee' → 'quads', 'hamstrings'
-- etc.

CREATE INDEX idx_injuries_user_active ON injuries(user_id, status);
CREATE INDEX idx_pain_logs_injury ON pain_logs(injury_id, date);
```

### UI Screens

1. **Injury List** — active injuries with severity badges + resolved history
2. **Log Injury** — body diagram + type/severity/notes form
3. **Injury Detail** — pain trend chart + treatment timeline + resolution
4. **Daily Check-In** — quick pain rating for each active injury
5. **Exercise Warning** — yellow icon on exercises + explanation bottom sheet

---

## Feature 20: Weekly / Monthly Review Reports

### Overview

Auto-generated training summaries delivered weekly and monthly. Includes key metrics, trends, comparisons to previous periods, and shareable visual cards.

### How It Works

**Auto-Generation Schedule:**
- Weekly report: generated every Sunday at 21:00 (user's local time)
- Monthly report: generated on the 1st of each month
- Push notification: "Your weekly review is ready!"
- Accessible from the feed (appears as a report card) and from a dedicated "Reviews" section

**Weekly Report Content:**

1. **Overview Stats:**
   - Total sessions (gym + activity)
   - Total gym volume (kg)
   - Total distance (km)
   - Total active minutes
   - Total calories burned
   - Habit completion rate (%)

2. **Comparison with Previous Week:**
   - Delta for each metric: "+15% volume", "-2 sessions", "+5km distance"
   - Color coded: green for improvement, red for decline, grey for neutral
   - Arrow indicators (up/down/flat)

3. **Highlights:**
   - PRs hit this week (list with exercise name + value)
   - Longest streak currently active
   - Most trained muscle group
   - Best session of the week (highest volume or longest activity)

4. **Mini Charts:**
   - Daily session count (7 bars, one per day)
   - Volume per session (line chart)
   - Step count per day (bar chart)

**Monthly Report Content:**
- Everything in the weekly report, aggregated over the month
- Additional:
  - Weight change (start of month vs end of month)
  - Month-over-month trend (is this month better than last month?)
  - "Month in numbers" summary card
  - Top 3 exercises by volume
  - Top 3 activities by distance
  - Achievement badges earned this month

**Shareable Review Card:**
- Condensed visual card (similar to workout share cards)
- Shows: "Week 10 Review" with key stats in a grid layout
- Customizable theme (reuse existing share card themes)
- Share via system share sheet

**Configuration:**
- Settings > Reports > Weekly Review: on/off
- Settings > Reports > Monthly Review: on/off
- Choose which metrics to include (checkboxes)
- Notification time preference

### Implementation Notes

- Report generation runs as a local background task (no server needed for basic reports)
- Query all relevant data for the period using existing React Query hooks
- Render the report as a scrollable page with chart components
- Share card generated using the same ViewShot approach as workout share cards
- Store generated reports locally for history (or in Supabase for cross-device access)

### Data Model

Builds on existing `report_schedules` and `generated_reports` tables. Add:

```sql
-- Store report content as structured JSON for offline access
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'custom'; -- 'weekly', 'monthly', 'custom'
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS comparison_data JSONB; -- deltas vs previous period
```

### UI Screens

1. **Review Page** — scrollable report with stats, comparisons, and charts
2. **Review History** — list of past weekly/monthly reviews
3. **Share Card** — condensed visual summary for sharing
4. **Report Settings** — toggle weekly/monthly, choose metrics, notification time

---

## Priority Matrix

| # | Feature | Effort | Impact | Dependencies | Recommended Priority |
|---|---------|--------|--------|--------------|---------------------|
| 1 | Workout Programs | High | High | Gym templates | 8 |
| 2 | Exercise Progress Charts | Low | High | Existing data | **1** |
| 3 | Personal Records (PR) | Medium | High | Existing data | **2** |
| 4 | Body Measurements | Medium | Medium | Weight tracking | 10 |
| 5 | Workout Calendar | Medium | High | Templates | 6 |
| 6 | Nutrition / Meals | High | Medium | New module | 14 |
| 7 | Achievements / Badges | Medium | High | PR system | 7 |
| 8 | Smart Rest Timer | Low | Medium | Existing timer | **3** |
| 9 | Supersets & Circuits | High | Medium | Gym session model | 11 |
| 10 | Sleep Tracking | Low | Medium | New module | 9 |
| 11 | Social Feed & Friends | High | High | Existing friends stub | 12 |
| 12 | Data Export | Medium | Medium | All data | 13 |
| 13 | Custom Dashboard | High | Medium | All widgets | 16 |
| 14 | Stretching Routines | Medium | Medium | Timer system | 15 |
| 15 | Heart Rate Zones | High | Medium | Bluetooth (new dep) | 17 |
| 16 | AI Workout Suggestions | Low | Medium | Existing data | **4** |
| 17 | Dark / Light Theme | Medium | Medium | All screens | 5 |
| 18 | Music Integration | Medium | Low | Platform APIs | 18 |
| 19 | Injury Log | Medium | Medium | Gym exercises | 9 |
| 20 | Weekly/Monthly Reviews | Low | Medium | Existing reports | **5** |

**Top 5 Quick Wins (low effort, high value):**
1. Exercise Progress Charts — data exists, just add visualization
2. Personal Records — detection logic + celebration UI
3. Smart Rest Timer Auto-Start — small enhancement to existing timer
4. AI Workout Suggestions — queries against existing data, no new infrastructure
5. Weekly/Monthly Reviews — aggregate existing data into report cards
