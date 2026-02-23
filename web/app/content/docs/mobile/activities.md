# Activities

The Activities feature lets you track activity sessions — running, walking, cycling, gym workouts, and more — with optional GPS location tracking, live step counting, calorie estimation, and voice recordings. Sessions are saved with full route data, stats, and notes for later review.

---

## Overview

An activity session captures everything about a physical activity:

- **Duration** — Total elapsed time with pause/resume support
- **Steps** — Live count from device step sensor (Android)
- **Distance** — Calculated from GPS coordinates (haversine formula)
- **Calories** — Estimated using MET value × user weight × moving time
- **Speed & Pace** — Real-time km/h and min/km from GPS
- **Altitude & Heading** — Elevation and compass direction
- **Route** — Full GPS track stored as PostGIS geometry
- **Voice Notes** — Audio recordings attached to the session
- **Moving Time** — Only time spent actually moving (stationary periods excluded)

---

## Activity Types

Activities are organized by category. Each activity has a `base_met` (Metabolic Equivalent) value used for calorie calculation.

**Categories:** Cardio, Strength, Sports, HIIT, Recreation, Gym, Balance, Transportation, Recovery, Outdoor, Mobility, Mindfulness, Swimming

**Built-in activities include:** Running, Walking, Cycling, Hiking, Swimming, Climbing, Gym, Weight Training, Bodyweight Training, Sports, Dancing, Pilates, Cross Training, Stretching, Meditation, and more.

Users can also create **custom activities** with their own name and MET value.

---

## Starting an Activity

1. Navigate to the "Start Activity" screen
2. Select an activity type from the dropdown
3. Toggle **GPS tracking** on/off (requires background location permission)
4. Toggle **Step tracking** on/off (requires activity recognition permission)
5. Tap **Start Activity**

On start, the system:
- Initializes a local SQLite database for GPS points (if GPS enabled)
- Starts the native Android step counter
- Begins background GPS tracking (3-second interval, 1m minimum distance)
- Shows a persistent timer notification

---

## During an Activity

- **Pause/Resume** via the floating timer
- **Live metrics** update in real-time: steps, distance, speed, pace, heading, altitude
- **GPS points** recorded continuously to local SQLite (filtered for accuracy > 30m)
- **Voice recordings** can be added at any time
- **Notes** can be written during the session
- **Battery optimization warning** shown if GPS is active and battery optimization is on

---

## Saving an Activity

When the user taps **Save**:

1. GPS tracking stops
2. GPS points are loaded from local SQLite, filtered, and smoothed
3. Stats are computed server-side via Supabase RPC
4. Voice recordings are uploaded to Supabase Storage (`notes-voice` bucket)
5. Session is saved to Supabase with full route geometry

**Warmup detection** — The system identifies slow/stationary movement at the start and excludes it from distance and pace calculations.

---

## Route Templates

Users can save completed activity routes as **templates** for reuse:

- Template stores: name, notes, distance, and route geometry
- When starting a new activity with a template, the saved route is shown as an overlay on the map
- Useful for following the same running/cycling path regularly

---

## Session History

**My Sessions** screen shows all completed activities with:
- Activity type and icon
- Duration, distance, date/time
- Pin/unpin, edit, and delete options

**Session Details** screen includes:
- Full map with route (if GPS was tracked)
- All computed stats (distance, pace, speed, steps, calories)
- Elevation and speed charts
- Voice recording playback
- Option to save route as a template

---

## Analytics

- **Steps dashboard** — Daily, 7-day, 30-day, and 90-day views
- **Activity breakdown** — Pie chart by activity type
- **Today's steps** — Live count from device sensor

---

## Permissions (Android)

- **Foreground + Background Location ("Always")** — Required for GPS tracking
- **Activity Recognition** — Required for step counting
- **Battery Optimization Bypass** — Recommended for reliable background GPS

---

## Data Storage

**Supabase (cloud):**
- `sessions` — Session metadata (title, notes, duration, dates, PostGIS geometry)
- `session_stats` — Computed stats (distance, moving time, calories, steps, pace, speed)
- `activity_gps_points` — Full GPS track data
- `sessions_voice` — Voice recording references
- `activity_templates` — Saved route templates
- `activities` — Activity type definitions with MET values
- `steps_daily` — Daily step aggregation

**Local (on-device):**
- SQLite — GPS points during active session (synced to cloud on save)
- AsyncStorage — Activity draft state

---

## Key Technical Details

- **GPS filtering** — Points with accuracy > 30m flagged as bad signal; stationary detection reduces noise
- **Distance calculation** — Haversine formula on filtered GPS points
- **Calorie formula** — `baseMET × userWeight × (movingTime / 3600)`
- **State management** — Zustand for timer/session state, React Query for server data
- **Native modules** — Android step counter and battery optimization API (Kotlin)
- **Background tracking** — Expo Location foreground service with persistent notification
