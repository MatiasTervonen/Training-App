# Feature Roadmap

Overview of the current app state and recommended new features to improve the experience.

---

## Current App Overview

| Module | Status |
|--------|--------|
| **Gym Workouts** | Fully functional — exercises, sets/reps/weight, templates, rest timer, muscle groups, analytics, exercise history |
| **Activity Tracking** | Fully functional — GPS routes (Mapbox), steps, pace, distance, calories, voice notes, templates |
| **Weight Tracking** | Functional — entries + data table |
| **Timer / Stopwatch** | Fully functional — countdown, stopwatch, saved timers, native alarms |
| **Notes** | Fully functional — quick notes, folders, voice recordings |
| **Reminders** | Fully functional — daily/weekly/one-time, push notifications |
| **Todo Lists** | Fully functional — create lists, tasks, drafts, pinning |
| **Feed / Dashboard** | Fully functional — unified feed, pinning, infinite scroll |
| **Auth** | Complete — email, Google Sign-In, guest login |
| **Onboarding** | Complete — language, permissions, weight/units |
| **Android Widgets** | Partial — steps widget, quick links |
| **i18n** | English + Finnish |

---

## Feature Recommendations

### High Impact — Core Fitness Features

#### 1. Personal Records (PR) Tracking

Automatically detect and celebrate when users hit a new max weight, max reps, or fastest pace. Show PR badges on exercises in the feed.

- Detect PRs per exercise (max weight, max reps, max volume in a single set)
- Show a badge/icon on the set that broke the record
- PR history page per exercise
- Notification/toast when a PR is hit during a session
- Data already exists in exercise history — needs detection logic + UI

#### 2. Workout Scheduling / Calendar View

Templates exist but there is no way to plan ahead. A weekly calendar where users can assign templates to days.

- Calendar view showing planned vs completed workouts
- Drag/assign templates to specific days
- Push notification reminders for scheduled workouts
- Weekly/monthly overview of training plan adherence

#### 3. Exercise Progress Charts

Per-exercise line graphs showing weight/volume progression over time (e.g. "Bench Press last 6 months").

- Line chart for weight progression per exercise
- Volume (sets x reps x weight) trend over time
- Selectable time ranges (30D / 90D / 6M / 1Y / All)
- Exercise history data already exists — needs chart visualization

#### 4. Weight Analytics Charts

The weight page currently only shows a data table. A trend line chart would make it much more useful.

- Weight trend line chart using echarts or victory-native (already in the project)
- Goal weight line overlay
- Selectable time ranges
- 7-day moving average smoothing

#### 5. Supersets & Circuit Support

Allow grouping exercises within a gym session.

- A1/A2 superset pairing
- Circuit grouping (3+ exercises)
- Visual grouping in the session UI
- Grouped rest timer behavior

---

### Medium Impact — Engagement & Retention

#### 6. Achievements / Badges System

Gamification to drive daily engagement.

- **Streak badges** — 7-day, 30-day, 100-day workout streaks
- **Milestone badges** — 100 workouts, 1000 kg total volume, etc.
- **PR badges** — tied to personal records
- **Activity badges** — first 10 km run, first marathon distance, etc.
- Achievement showcase on profile page

#### 7. Progress Photos

Timeline of body photos with before/after comparison.

- Photo capture with consistent framing guides
- Timeline gallery sorted by date
- Before/after comparison slider
- Pair with weight entries for context
- Store in Supabase storage bucket

#### 8. Data Export

Export sessions to CSV or PDF for coaches, backups, or compliance.

- Export gym sessions (exercises, sets, reps, weight)
- Export activity sessions (route GPX, stats)
- Export weight history
- CSV and/or PDF format
- Share via system share sheet

#### 9. Workout Summary Sharing

Generate a shareable card/image of a completed session.

- Auto-generate summary card after session completion
- Include: exercises, total volume, duration, date
- Styled card suitable for Instagram stories or messaging
- Share via system share sheet
- Viral growth driver

#### 10. Rest Timer Auto-Start

Automatically start the rest timer when a set is marked complete.

- Toggle in gym settings (off by default)
- Start rest timer on set completion
- Skip button to dismiss early
- Pairs with existing rest timer infrastructure

---

### Lower Impact — Nice to Have

#### 11. Stretching / Warmup Routines

Pre-built or custom stretch routines with per-movement timers.

- Library of common stretches with descriptions
- Custom routine builder
- Timer per stretch with auto-advance
- Attach warmup/cooldown to gym templates

#### 12. Social / Friends Feed

Friend stubs already exist in the codebase. Build out the social layer.

- View friends' completed workouts
- Like/comment on sessions
- Leaderboards (weekly volume, streak length)
- Social accountability for retention

#### 13. Nutrition / Meal Logging

Simple calorie or meal tracking to complement weight tracking.

- Quick calorie entry per meal
- Meal photo log
- Daily calorie summary
- Pair with weight chart for correlation

#### 14. Dark / Light Theme Toggle

App is currently dark-only (slate-900 background). Add a light mode option.

- Light theme color palette
- Toggle in settings (dark / light / system)
- Persist preference in user settings store

#### 15. Disc Golf Scorecard

Finish the existing disc-golf stub.

- Score tracking per hole
- Course management (create/save courses)
- Round history and stats
- Par tracking and +/- indicators

---

## Recommended Priority Order

Best effort-to-value ratio, considering existing data and infrastructure:

| Priority | Feature | Rationale |
|----------|---------|-----------|
| 1 | PR Tracking | Exercise history data exists. Needs detection logic + UI badges. Huge motivational impact. |
| 2 | Weight Trend Chart | Echarts already in project. Wire existing weight data into a line chart. Quick win. |
| 3 | Exercise Progress Charts | Data exists, visualization doesn't. Per-exercise graphs transform the analytics experience. |
| 4 | Rest Timer Auto-Start | Small change to existing rest timer system. Quality-of-life improvement. |
| 5 | Workout Summary Sharing | Moderate effort, high viral potential. |
| 6 | Achievements / Badges | Medium effort, strong retention impact. |
| 7 | Data Export | Medium effort, important for trust and data portability. |
| 8 | Workout Scheduling | Larger effort but makes the app a planner, not just a logger. |
| 9 | Progress Photos | Medium effort, pairs well with weight tracking. |
| 10 | Supersets & Circuits | Requires gym session model changes. Important for intermediate users. |
