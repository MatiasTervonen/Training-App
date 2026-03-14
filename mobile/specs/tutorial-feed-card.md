# Tutorial Feed Card

## Overview

Add a tutorial/welcome card that automatically appears on every new user's feed. The card is larger than normal feed cards and contains a guided walkthrough of the app's features with images hosted on Supabase Storage. It's auto-pinned so it stays at the top until the user unpins or deletes it.

---

## Design Decisions

### How does the tutorial card get created?

Automatically via the existing `handle_new_user()` Supabase trigger. When a new user registers, the trigger already inserts into `users` and `user_settings` — we add a third insert for the tutorial feed item + a pinned_items row.

### Why insert in the trigger instead of during onboarding?

The trigger guarantees every user gets the card regardless of how they sign up. If onboarding is skipped, interrupted, or changes in the future, the tutorial still appears.

### What about `source_id` (NOT NULL)?

The tutorial has no domain table. Use the feed item's own `id` as `source_id` — insert with a pre-generated UUID used for both fields (same pattern concept as habits which are feed-only items).

### Can users delete it?

Yes. The existing `feed_delete_session` RPC handles deletion. Add a `tutorial` case that simply deletes from `pinned_items` + `feed_items` with no domain table cleanup needed.

### Can users edit it?

No. The tutorial content is static and rendered client-side. The edit option should not appear in the dropdown menu for tutorial cards.

### Can users hide it?

Yes. Standard hide behavior works — sets `hidden_at` on the feed item.

### How are images handled?

Images are hosted in a **public** Supabase Storage bucket called `tutorial-images`. The tutorial card component references these public URLs directly. Image URLs are hardcoded in the component since the content is the same for all users.

Public bucket means no auth required to fetch images — they load fast with no signed URL overhead.

### Card size

Same size as every other feed card. Uses `BaseFeedCard` with a simple `statsContent` (subtitle text). All images and feature sections are shown only in the **expanded modal view** — the feed card is just a teaser.

---

## Database Schema

### 1. Create `tutorial-images` storage bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutorial-images',
  'tutorial-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Public read access (no auth needed)
CREATE POLICY "Anyone can read tutorial images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tutorial-images');
```

No insert/delete policies for regular users — only admins upload tutorial images via the Supabase dashboard.

### 2. Update `handle_new_user()` trigger

Add tutorial feed item + pin it after the existing `users` and `user_settings` inserts:

```sql
-- Inside handle_new_user(), after user_settings insert:
declare
  v_feed_id uuid := gen_random_uuid();
begin
  -- ... existing user + user_settings inserts ...

  INSERT INTO public.feed_items (id, user_id, title, type, source_id, occurred_at)
  VALUES (v_feed_id, new.id, 'Welcome to MyTrack!', 'tutorial', v_feed_id, now());

  INSERT INTO public.pinned_items (user_id, feed_item_id, type, pinned_context)
  VALUES (new.id, v_feed_id, 'tutorial', 'main');

  return new;
end;
```

Note: `source_id = v_feed_id` (self-referencing) since there's no domain table.

### 3. Update `feed_delete_session` RPC

Add a `tutorial` case that skips domain table deletion (there is none):

```sql
WHEN 'tutorial' THEN
  -- No domain table to delete, just clean up feed + pin
  NULL;
```

The existing logic already handles deleting from `pinned_items` and `feed_items`.

---

## Storage: Tutorial Images

Upload images to the `tutorial-images` bucket via Supabase dashboard. Suggested structure:

```
tutorial-images/
  welcome.webp          -- Hero/welcome image
  gym-tracking.webp     -- Gym feature screenshot
  activities.webp       -- Activities feature screenshot
  weight.webp           -- Weight tracking screenshot
  notes.webp            -- Notes feature screenshot
  reminders.webp        -- Reminders feature screenshot
  habits.webp           -- Habits feature screenshot
```

Use `.webp` format for smaller file sizes. Keep images under 500KB each for fast loading.

Public URL format: `{SUPABASE_URL}/storage/v1/object/public/tutorial-images/welcome.webp`

---

## Client Implementation

### 1. Tutorial card component: `features/feed-cards/tutorial-feed.tsx`

Uses `BaseFeedCard` like every other card type. Same size, same layout.

- **statsContent**: A subtitle like "Your guide to getting started" and a small "Tap Details to read the full guide" hint — no images on the feed card itself
- **typeIcon**: `BookOpen` from lucide-react-native
- **typeName**: `feed.card.types.tutorial`
- **Dropdown menu**: Pin/delete/hide only — no edit (pass `onEdit={undefined}`)
- **Expanded view**: Full scrollable tutorial with all feature sections, each with an image + title + description. This is where all the Supabase Storage images are shown.

### 2. Image loading

Use React Native `<Image>` with the public Supabase storage URLs:

```tsx
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const TUTORIAL_IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/tutorial-images`;

const tutorialSections = [
  { image: `${TUTORIAL_IMAGE_BASE}/gym-tracking.webp`, titleKey: "tutorial.gym.title", descKey: "tutorial.gym.desc" },
  { image: `${TUTORIAL_IMAGE_BASE}/activities.webp`, titleKey: "tutorial.activities.title", descKey: "tutorial.activities.desc" },
  // ... etc
];
```

### 3. Update `FeedCard.tsx`

Add the tutorial case to the switch statement:

```tsx
case "tutorial":
  return <TutorialCard {...commonProps} />;
```

### 4. Update `deleteSession.ts`

The `tutorial` type has no media to clean up. The `getMediaPaths` function can return empty arrays for unknown types (it already does — no `if` branch matches). No changes needed here — the RPC handles the actual deletion.

### 5. Expanded view

When the user taps "Details", show a full-screen modal with the complete tutorial. Use `ScrollView` with all feature sections rendered vertically — each section has:
- A feature image loaded from the public Supabase Storage URL
- Feature title (translated)
- Feature description (translated)

This is the only place images appear — the feed card itself is image-free and same-sized as other cards.

---

## Translations

### English (`locales/en/feed.json`)

```json
{
  "feed.card.types.tutorial": "Tutorial",
  "feed.tutorial.title": "Welcome to MyTrack!",
  "feed.tutorial.subtitle": "Your complete guide to getting started",
  "feed.tutorial.gym.title": "Gym Tracking",
  "feed.tutorial.gym.desc": "Log your workouts with exercises, sets, reps, and weight. Use templates to save your favorite routines.",
  "feed.tutorial.activities.title": "Activities",
  "feed.tutorial.activities.desc": "Track outdoor activities like running, cycling, and walking with GPS, duration, and distance.",
  "feed.tutorial.weight.title": "Weight Tracking",
  "feed.tutorial.weight.desc": "Log your weight and track your progress over time with charts and statistics.",
  "feed.tutorial.notes.title": "Notes",
  "feed.tutorial.notes.desc": "Write notes and organize them into folders. Add voice recordings, images, and videos.",
  "feed.tutorial.reminders.title": "Reminders",
  "feed.tutorial.reminders.desc": "Set one-time or recurring reminders with push notifications to stay on track.",
  "feed.tutorial.habits.title": "Habits",
  "feed.tutorial.habits.desc": "Build daily habits and track your streaks. See your consistency on the feed.",
  "feed.tutorial.todo.title": "To-Do Lists",
  "feed.tutorial.todo.desc": "Create task lists to organize your training goals and daily tasks.",
  "feed.tutorial.tap_to_read": "Tap Details to read the full guide"
}
```

### Finnish (`locales/fi/feed.json`)

```json
{
  "feed.card.types.tutorial": "Opas",
  "feed.tutorial.title": "Tervetuloa MyTrackiin!",
  "feed.tutorial.subtitle": "Täydellinen opas alkuun pääsemiseen",
  "feed.tutorial.gym.title": "Kuntosaliharjoittelu",
  "feed.tutorial.gym.desc": "Kirjaa treenisi liikkeineen, sarjoineen, toistoineen ja painoineen. Käytä pohjia tallentaaksesi suosikkirutiinisi.",
  "feed.tutorial.activities.title": "Aktiviteetit",
  "feed.tutorial.activities.desc": "Seuraa ulkoilma-aktiviteetteja kuten juoksu, pyöräily ja kävely GPS:n, keston ja matkan avulla.",
  "feed.tutorial.weight.title": "Painonseuranta",
  "feed.tutorial.weight.desc": "Kirjaa painosi ja seuraa edistymistäsi ajan myötä kaavioiden ja tilastojen avulla.",
  "feed.tutorial.notes.title": "Muistiinpanot",
  "feed.tutorial.notes.desc": "Kirjoita muistiinpanoja ja järjestä ne kansioihin. Lisää äänityksiä, kuvia ja videoita.",
  "feed.tutorial.reminders.title": "Muistutukset",
  "feed.tutorial.reminders.desc": "Aseta kertaluonteisia tai toistuvia muistutuksia push-ilmoituksilla pysyäksesi aikataulussa.",
  "feed.tutorial.habits.title": "Tavat",
  "feed.tutorial.habits.desc": "Rakenna päivittäisiä tapoja ja seuraa putkiasi. Näe johdonmukaisuutesi syötteessä.",
  "feed.tutorial.todo.title": "Tehtävälistat",
  "feed.tutorial.todo.desc": "Luo tehtävälistoja järjestääksesi harjoitustavoitteesi ja päivittäiset tehtäväsi."
}
```

---

## UI Flow

### New user registration
1. User signs up
2. `handle_new_user()` trigger fires
3. Trigger inserts `users` row, `user_settings` row, tutorial `feed_items` row, and `pinned_items` row
4. User completes onboarding, lands on feed
5. Tutorial card appears pinned at the top of their feed

### Interacting with the tutorial card
1. Card shows in pinned section — same size as other cards, with subtitle text
2. User taps "Details" → full tutorial opens in expanded modal with all feature sections and images
3. User can unpin → card flows down the feed naturally as new items are added above it
4. User can delete → card is permanently removed
5. User can hide → card is hidden from feed

### Existing users
- Existing users do NOT get the tutorial card (trigger only fires on new registrations)
- No backfill migration needed — this is for new users only

---

## Scope

### In scope
- `tutorial-images` public storage bucket
- Updated `handle_new_user()` trigger to insert tutorial feed item + pin
- `tutorial-feed.tsx` card component (feed preview + expanded view)
- Updated `FeedCard.tsx` switch with tutorial case
- Updated `feed_delete_session` RPC for tutorial type
- Translations (EN/FI)

### Out of scope
- Backfilling tutorial cards for existing users
- Admin UI for editing tutorial content
- Analytics on tutorial card interactions
- In-app tutorial image upload — images are uploaded via Supabase dashboard
- Video content in the tutorial card
