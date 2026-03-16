# Social Feed Feature

## Overview

Add a social feed where users can see their friends' training activities and interact with likes. The feature builds on the existing `friends` system and `feed_items` table. Comments may be added as a future enhancement.

---

## Design Decisions

### What gets shared?

| Type | Shareable | Reason |
|------|-----------|--------|
| `gym_sessions` | Yes | Core training content |
| `activity_sessions` | Yes | Core training content |
| `weight` | No | Too personal (just a body weight number), not interesting social content |
| `habits` | Yes | Daily habit completions |
| `notes` | No | Personal/private |
| `todo_lists` | No | Personal/private |
| `global_reminders` | No | Personal/private |
| `local_reminders` | No | Personal/private |
| `reports` | No | Personal/private |

### Visibility model: Hybrid (global defaults + per-session override)

**Global defaults** in user settings (per session type):
- "Share gym sessions with friends" (on/off)
- "Share activities with friends" (on/off)
- "Share habit completions with friends" (on/off)

**Per-session override** at save time:
- Toggle on the save screen: "Share with friends" (pre-filled from global default)
- User can flip it for any individual session

**Default state**: All sharing OFF. User must opt-in.

### Where to store visibility?

On the `feed_items` table — add a `visibility` column. This is the right place because:
- `feed_items` is already the denormalized index that powers the feed
- No need to modify every domain table (gym_sessions, sessions, weight, etc.)
- Single place to query for the social feed
- Single place to check permissions

### How do social feed cards work?

Same pattern as the personal feed — lightweight preview card + expandable full view:

**Social Feed Card (preview in feed list)**
```
+------------------------------------------+
|  [avatar] FriendName            2h ago   |
|------------------------------------------|
|  "Push Day"                              |
|  Exercises: 5   Sets: 18   45 min       |
|------------------------------------------|
|  [heart] 3 likes              [Details>] |
+------------------------------------------+
```

- Uses the same `extra_fields` summary data as current feed cards (no extra DB query)
- Adds author header row: profile picture (32px circle) + display name + relative time
- Replaces the dropdown menu (no edit/pin/delete on friend posts) with like footer
- Keeps the "Details" button for expansion
- Reuses the stats rendering logic from existing cards (GymCard, ActivityCard, WeightCard)

**Expanded View (read-only, opened via "Details")**

Opens a `FullScreenModal` with the same expanded components (`GymSession`, `ActivitySession`, `WeightSession`) but in read-only mode:

- No edit button, no delete, no pin
- No exercise history button (friend's private data)
- No share card button (their session)
- Like button at the bottom of the expanded view

**How to fetch the full session data for a friend's post?**

Current RLS blocks friends from reading raw session tables. Two options considered:

| Option | Approach | Verdict |
|--------|----------|---------|
| A: New RPC | `get_friend_session(p_feed_item_id)` checks friendship + visibility, returns full data | **Chosen** |
| B: RLS policies | Add friend-read SELECT policies to every session table | Too many policies |

Option A is cleaner. One RPC per session type (or a polymorphic one) that:
1. Verifies the caller is friends with the post owner
2. Verifies the feed_item has `visibility = 'friends'`
3. Returns the full session data (same shape as the existing get-full-session functions)

The existing `useFullSessions` hook is adapted to call a different fetch function when the item belongs to a friend (detected by `user_id !== auth.uid()`). The same expanded UI components are reused with a `readOnly` prop to hide edit/delete/history actions.

**RPC functions needed:**

```sql
-- Returns full gym session for a friend's shared post
DROP FUNCTION IF EXISTS get_friend_gym_session(uuid);
CREATE FUNCTION get_friend_gym_session(p_feed_item_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_feed_item feed_items%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Fetch feed item and verify it's shared
  SELECT * INTO v_feed_item
  FROM feed_items
  WHERE id = p_feed_item_id
    AND visibility = 'friends'
    AND type = 'gym_sessions';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found or not shared';
  END IF;

  -- Verify caller is friends with the post owner
  IF NOT EXISTS (
    SELECT 1 FROM friends
    WHERE (user1_id = auth.uid() AND user2_id = v_feed_item.user_id)
       OR (user1_id = v_feed_item.user_id AND user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Build full session response (same shape as existing get-full-gym-session)
  SELECT jsonb_build_object(
    'id', gs.id,
    'title', gs.title,
    'notes', gs.notes,
    'duration', gs.duration,
    'start_time', gs.created_at,
    'end_time', gs.updated_at,
    -- ... exercises, sets, media etc.
  ) INTO v_result
  FROM gym_sessions gs
  WHERE gs.id = v_feed_item.source_id;

  RETURN v_result;
END;
$$;
```

Similar RPC for `get_friend_activity_session`. The exact column selection mirrors the existing get-full-session database functions.

---

## Database Schema

### 1. Add `visibility` column to `feed_items`

```sql
ALTER TABLE feed_items
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
CHECK (visibility IN ('private', 'friends'));
```

### 2. Add `sharing_defaults` table

Stores per-user, per-type sharing preferences.

```sql
CREATE TABLE sharing_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  share_with_friends BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, session_type),
  CHECK (session_type IN ('gym_sessions', 'activity_sessions', 'habits'))
);

-- RLS
ALTER TABLE sharing_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own sharing defaults"
  ON sharing_defaults FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 3. Create `feed_likes` table

```sql
CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);

CREATE INDEX idx_feed_likes_feed_item ON feed_likes(feed_item_id);
CREATE INDEX idx_feed_likes_user ON feed_likes(user_id);

-- RLS
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

-- Users can see likes on their own posts and on friends' shared posts
CREATE POLICY "Users can read likes on visible feed items"
  ON feed_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feed_items fi
      WHERE fi.id = feed_item_id
      AND (
        fi.user_id = auth.uid()
        OR (
          fi.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
               OR (user1_id = fi.user_id AND user2_id = auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert own likes"
  ON feed_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON feed_likes FOR DELETE
  USING (user_id = auth.uid());
```

### 4. Update `feed_items` RLS for friend visibility

Add a new SELECT policy so friends can read shared items:

```sql
CREATE POLICY "Friends can read shared feed items"
  ON feed_items FOR SELECT
  USING (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = feed_items.user_id)
         OR (user1_id = feed_items.user_id AND user2_id = auth.uid())
    )
  );
```

The existing policy `"allow user to CRUD own items"` continues to work for the user's own feed.

### 5. Update `users` RLS for social feed

Friends need to see each other's display_name and profile_picture in the social feed. Add:

```sql
CREATE POLICY "Friends can read friend profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = users.id)
         OR (user1_id = users.id AND user2_id = auth.uid())
    )
  );
```

Check if the existing "authenticated users can read profiles" policy already covers this — if so, skip.

### 6. RPC: `get_friends_feed`

```sql
DROP FUNCTION IF EXISTS get_friends_feed(integer, integer);
CREATE FUNCTION get_friends_feed(p_limit integer, p_offset integer)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  type TEXT,
  extra_fields JSONB,
  source_id UUID,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  activity_at TIMESTAMPTZ,
  visibility TEXT,
  author_display_name TEXT,
  author_profile_picture TEXT,
  like_count BIGINT,
  user_has_liked BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fi.id,
    fi.user_id,
    fi.title,
    fi.type,
    fi.extra_fields,
    fi.source_id,
    fi.occurred_at,
    fi.created_at,
    fi.updated_at,
    fi.activity_at,
    fi.visibility,
    u.display_name AS author_display_name,
    u.profile_picture AS author_profile_picture,
    COALESCE(lk.cnt, 0) AS like_count,
    EXISTS (
      SELECT 1 FROM feed_likes fl
      WHERE fl.feed_item_id = fi.id AND fl.user_id = auth.uid()
    ) AS user_has_liked
  FROM feed_items fi
  JOIN users u ON u.id = fi.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM feed_likes WHERE feed_item_id = fi.id
  ) lk ON true
  WHERE fi.visibility = 'friends'
    AND fi.user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (user1_id = auth.uid() AND user2_id = fi.user_id)
         OR (user1_id = fi.user_id AND user2_id = auth.uid())
    )
  ORDER BY fi.activity_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

### 7. RPC: `toggle_feed_like`

```sql
DROP FUNCTION IF EXISTS toggle_feed_like(uuid);
CREATE FUNCTION toggle_feed_like(p_feed_item_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if already liked
  SELECT EXISTS (
    SELECT 1 FROM feed_likes
    WHERE feed_item_id = p_feed_item_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM feed_likes
    WHERE feed_item_id = p_feed_item_id AND user_id = auth.uid();
    RETURN false; -- unliked
  ELSE
    INSERT INTO feed_likes (feed_item_id, user_id)
    VALUES (p_feed_item_id, auth.uid());
    RETURN true; -- liked
  END IF;
END;
$$;
```

### 8. Update existing save RPCs

Every save RPC that creates a `feed_items` row needs to accept a `p_visibility` parameter:

- `gym_save_session` — add `p_visibility TEXT DEFAULT 'private'`
- `activity_save_session` (or equivalent) — add `p_visibility TEXT DEFAULT 'private'`
- `habit_toggle_log` — visibility based on sharing_defaults (query inside RPC)

Pass `p_visibility` into the `INSERT INTO feed_items` statement.

---

## Mobile Implementation

### Phase 1: Database & Settings

#### 1.1 Migration file

`supabase/migrations/YYYYMMDDHHmmss_social_feed.sql`

Contains all schema changes from above: visibility column, sharing_defaults table, feed_likes, RLS policies, RPC functions.

#### 1.2 Sharing Settings Page

New page: `app/menu/sharing-settings/index.tsx`

```
Sharing Settings
------------------------------
Share with friends by default:

[ ] Gym sessions
[ ] Activities
[ ] Weight entries
[ ] Habit completions

These defaults apply when you save
a new session. You can always change
visibility for individual sessions.
```

- Each toggle calls upsert on `sharing_defaults` table
- Use React Query mutation with optimistic update
- Link from menu page (add "Sharing" menu item)

#### 1.3 Per-session visibility toggle

Add a "Share with friends" toggle to each save flow:

- **Gym save**: Add toggle to the save confirmation / title screen
- **Activity save**: Add toggle to the save screen
- **Habits**: Auto-share based on sharing_defaults (no per-session toggle needed — habits are daily aggregates)

The toggle is pre-filled from `sharing_defaults` for that session type. Pass the value to the save RPC.

### Phase 2: Social Feed Page

#### 2.1 New tab or menu page?

**Option A: New bottom tab** — "Social" tab with people icon. Most discoverable, but adds a 6th tab.

**Option B: Sub-tab on dashboard** — Toggle between "My Feed" and "Friends" at the top of the existing feed page. Keeps navigation simple.

**Recommendation: Option B** — Add a segmented control / tab bar at the top of the dashboard. Two segments: "My Feed" | "Friends". This avoids adding another bottom tab and keeps the social feed close to the personal feed.

#### 2.2 Social Feed Hook

`features/social-feed/hooks/useSocialFeed.ts`

```ts
export function useSocialFeed() {
  return useInfiniteQuery({
    queryKey: ["social-feed"],
    queryFn: ({ pageParam = 0 }) => getFriendsFeed(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.flat().length;
    },
  });
}
```

#### 2.3 Social Feed Data Fetcher

`database/social-feed/get-friends-feed.ts`

```ts
export async function getFriendsFeed(offset: number) {
  const { data, error } = await supabase.rpc("get_friends_feed", {
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });
  // ...error handling
  return data;
}
```

#### 2.4 Like Database Function

`database/social-feed/toggle-like.ts`
```ts
export async function toggleLike(feedItemId: string) {
  const { data, error } = await supabase.rpc("toggle_feed_like", {
    p_feed_item_id: feedItemId,
  });
  return { liked: data, error };
}
```

#### 2.5 Like Mutation Hook

`features/social-feed/hooks/useToggleLike.ts`
```ts
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLike,
    onMutate: async (feedItemId) => {
      // Optimistic update: flip liked state, adjust count
      await queryClient.cancelQueries({ queryKey: ["social-feed"] });
      queryClient.setQueryData(["social-feed"], (old) => {
        // flip user_has_liked and adjust like_count +/- 1
      });
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
```

#### 2.6 SocialFeedCard Component

`features/social-feed/components/SocialFeedCard.tsx`

Wraps the existing card type renderers but adds social context:

```
+------------------------------------------+
|  [avatar] FriendName          2h ago      |
|------------------------------------------|
|                                          |
|  [Existing card content based on type]   |
|  GymCard / ActivityCard / WeightCard     |
|  (reuse statsContent from BaseFeedCard)  |
|                                          |
|------------------------------------------|
|  [heart] 3 likes              [Details>] |
+------------------------------------------+
```

Structure:
- **Header row**: Profile picture (32x32 circle), display name, relative timestamp
- **Body**: Render the same stats content as the existing feed cards (reuse GymCard, ActivityCard, WeightCard stat sections)
- **Footer row**: Like button (heart icon, filled if liked), like count, Details button for expansion
- Tap like button -> `useToggleLike` mutation
- Tap Details -> open read-only expanded view

#### 2.7 Dashboard Feed Toggle

Update `app/dashboard/index.tsx` (or wherever the main feed lives):

Add a segmented control at the top:

```tsx
const [feedMode, setFeedMode] = useState<"my" | "friends">("my");

// In FeedHeader:
<View className="flex-row gap-2 px-4 mb-3">
  <AnimatedButton
    onPress={() => setFeedMode("my")}
    className={feedMode === "my" ? "btn-base flex-1" : "btn-neutral flex-1"}
  >
    <AppText>{t("feed.myFeed")}</AppText>
  </AnimatedButton>
  <AnimatedButton
    onPress={() => setFeedMode("friends")}
    className={feedMode === "friends" ? "btn-base flex-1" : "btn-neutral flex-1"}
  >
    <AppText>{t("feed.friendsFeed")}</AppText>
  </AnimatedButton>
</View>
```

When `feedMode === "friends"`:
- Use `useSocialFeed()` instead of `useFeed()`
- Render `SocialFeedCard` instead of `FeedCard`
- Hide pinned carousel
- Show empty state if no friends or no shared posts

### Phase 3: Notifications (Future Enhancement)

Push notifications when someone likes your post. This can be a follow-up — the `notifications` table already exists with realtime enabled.

- On like: insert into `notifications` with `type: 'like'`
- Use Supabase database triggers or Edge Functions

---

## Types

```ts
// types/social-feed.ts

type SocialFeedItem = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  extra_fields: Record<string, unknown>;
  source_id: string;
  occurred_at: string;
  created_at: string;
  updated_at: string | null;
  activity_at: string;
  visibility: "private" | "friends";
  author_display_name: string;
  author_profile_picture: string | null;
  like_count: number;
  user_has_liked: boolean;
};
```

---

## Translations

### `locales/en/social.json`
```json
{
  "social": {
    "myFeed": "My Feed",
    "friendsFeed": "Friends",
    "noFriendPosts": "No posts from friends yet",
    "noFriendsYet": "Add friends to see their activity here",
    "shareWithFriends": "Share with friends",
    "likes": "likes",
    "like": "like",
    "ago": "ago"
  }
}
```

### `locales/fi/social.json`
```json
{
  "social": {
    "myFeed": "Oma syöte",
    "friendsFeed": "Kaverit",
    "noFriendPosts": "Ei vielä kavereiden julkaisuja",
    "noFriendsYet": "Lisää kavereita nähdäksesi heidän aktiviteettinsa täällä",
    "shareWithFriends": "Jaa kavereille",
    "likes": "tykkäystä",
    "like": "tykkäys",
    "ago": "sitten"
  }
}
```

### `locales/en/sharing.json`
```json
{
  "sharing": {
    "title": "Sharing Settings",
    "description": "Choose what to share with friends by default. You can change this for each session when saving.",
    "gymSessions": "Gym sessions",
    "activities": "Activities",
    "habitCompletions": "Habit completions",
    "saved": "Settings saved"
  }
}
```

### `locales/fi/sharing.json`
```json
{
  "sharing": {
    "title": "Jakamisasetukset",
    "description": "Valitse mitä jaat kavereille oletuksena. Voit muuttaa tätä jokaiselle harjoitukselle tallennettaessa.",
    "gymSessions": "Kuntosaliharjoitukset",
    "activities": "Aktiviteetit",
    "habitCompletions": "Tapasuoritukset",
    "saved": "Asetukset tallennettu"
  }
}
```

---

## File Structure

```
mobile/
  database/
    social-feed/
      get-friends-feed.ts
      get-friend-gym-session.ts
      get-friend-activity-session.ts
      toggle-like.ts
    sharing/
      get-sharing-defaults.ts
      upsert-sharing-default.ts
  features/
    social-feed/
      hooks/
        useSocialFeed.ts
        useToggleLike.ts
      components/
        SocialFeedCard.tsx
        SocialFeedCardHeader.tsx
        SocialFeedCardFooter.tsx
        FeedModeToggle.tsx
    sharing/
      hooks/
        useSharingDefaults.ts
        useUpdateSharingDefault.ts
  app/
    menu/
      sharing-settings/
        index.tsx
  types/
    social-feed.ts
  locales/
    en/
      social.json
      sharing.json
    fi/
      social.json
      sharing.json
supabase/
  migrations/
    YYYYMMDDHHmmss_social_feed.sql
```

---

## Implementation Order

### Step 1: Database migration
- Add visibility column, sharing_defaults, feed_likes tables
- Add RLS policies
- Add RPC functions (get_friends_feed, toggle_feed_like)
- Update existing save RPCs to accept p_visibility

### Step 2: Sharing settings
- sharing_defaults database functions
- Sharing settings page
- Add menu link
- Translations

### Step 3: Per-session visibility toggle
- Add toggle to gym save flow
- Add toggle to activity save flow
- Wire sharing_defaults as default value for toggle
- Update save functions to pass visibility

### Step 4: Social feed page
- Social feed data fetcher + hook
- SocialFeedCard component (header with avatar/name + reused stats body + like footer)
- Feed mode toggle on dashboard ("My Feed" | "Friends")
- Empty states
- Translations

### Step 5: Read-only expanded views
- RPC functions: `get_friend_gym_session`, `get_friend_activity_session`
- Database fetch functions for each
- Add `readOnly` prop to expanded view components (GymSession, ActivitySession, WeightSession)
  - Hides: edit button, delete, pin, exercise history, share card
  - Shows: like button at bottom
- Adapt `useFullSessions` to detect friend posts (`user_id !== currentUserId`) and call friend RPCs
- Social feed "Details" button opens FullScreenModal with read-only expanded view

### Step 6: Likes
- toggle-like database function + hook
- Like button on SocialFeedCard with optimistic update
- Like count display

### Step 7: Polish
- Likes on own shared posts (user should see likes on their own shared items from the personal feed)
- Notifications for likes (future)
- Pull-to-refresh on social feed

---

## Edge Cases

- **No friends**: Show "Add friends to see their activity" with link to friends page
- **Friends but no shared posts**: Show "No posts from friends yet"
- **User unfriends someone**: Their posts disappear from feed (RLS handles this automatically)
- **User changes visibility after likes exist**: Likes remain in DB but become invisible via RLS (feed_item visibility = 'private' means friends can't see it or its likes)
- **Deleted post**: CASCADE delete removes feed_item + likes
- **Own shared posts**: User can see likes on their own shared posts from their personal feed (need to add like counts to personal feed cards too, or show in expanded view)
- **Rapid like toggling**: Optimistic update + debounce prevents flickering

---

## Future Enhancements

- **Comments**: Add `feed_comments` table, CommentSheet component, and comment counts on cards. Designed to layer on top of the likes system without breaking changes.
- **Like notifications**: Push notification when someone likes your shared post.
- **Live session updates**: Polling-based refresh when viewing a friend's in-progress gym session.
