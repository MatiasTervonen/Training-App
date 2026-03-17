# Comments Feature

## Overview

Add comments to the social feed so friends can interact on shared sessions. Comments layer on top of the existing likes system — same visibility rules, same RLS patterns. Text-only, single-level replies (Instagram-style).

---

## Design Decisions

### What can be commented on?

Only shared feed items (`visibility = 'friends'`). Same items that can be liked — gym sessions and activity sessions that friends have shared.

### Who can comment?

- Friends of the post owner (same check as likes)
- The post owner themselves (to reply to friends)
- Users can delete their own comments
- No editing — delete and re-post to keep it simple

### Comment format

- Text-only, no media attachments
- Max 500 characters
- Single-level replies (Instagram-style) — you can reply to a comment, but not to a reply. Replies are grouped under their parent comment.
- No pagination — load all comments per post (training app posts won't get hundreds of comments)

### Reply model

Single-level threading using a `parent_id` column:

- **Top-level comments**: `parent_id = NULL` — sorted by oldest first
- **Replies**: `parent_id = <comment_id>` — shown indented under their parent, sorted by oldest first
- You can only reply to top-level comments (not to other replies) — this keeps nesting to exactly one level
- Replies show a small `@AuthorName` prefix so you know who they're responding to
- Tapping "Reply" on a comment pre-fills the input with `@AuthorName` and sets the parent_id

```
Comment A                           (parent_id = NULL)
  └─ @A's author: Nice!            (parent_id = A)
  └─ @A's author: Same here        (parent_id = A)
Comment B                           (parent_id = NULL)
  └─ @B's author: Thanks!          (parent_id = B)
```

### Where do comments appear?

**On the SocialFeedCard footer** — add a comment count + button next to the existing like button:

```
+------------------------------------------+
|  [heart] 3 likes   [chat] 2   [Details>] |
+------------------------------------------+
```

Tapping the comment button (or the count) opens a **bottom sheet** with the comment thread.

### Comment bottom sheet

```
+--------------------------------------------+
|  Comments (4)                          [X] |
|--------------------------------------------|
|  <ScrollView / FlatList>                   |
|                                            |
|  [avatar] FriendA                5m ago    |
|  Great session!                  [Reply]   |
|                                            |
|     [avatar] You                 3m ago    |
|     @FriendA Thanks!             [trash]   |
|                                            |
|     [avatar] FriendB             1m ago    |
|     @FriendA Same here!                    |
|                                            |
|  [avatar] FriendC                2m ago    |
|  Keep it up!                     [Reply]   |
|                                            |
|  -- or empty state --                      |
|  No comments yet                           |
|                                            |
|--------------------------------------------|
|  Replying to FriendA                 [X]   |  <- shown when replying
|  [input field]                [Send arrow] |
+--------------------------------------------+
```

- Shows all comments grouped by parent — top-level first (oldest), then their replies (oldest) indented below
- Top-level comments: profile picture (28px circle) + display name + relative time + text + Reply button
- Replies: indented (left padding), smaller avatar (24px), prefixed with `@ParentAuthor`
- Own comments show a delete button (trash icon)
- Reply button on top-level comments sets the reply context (shows "Replying to X" banner above input, sets parent_id)
- Tapping [X] on the reply banner cancels the reply and goes back to top-level mode
- Input field at bottom with send button
- Keyboard-aware — sheet content scrolls up when keyboard appears
- Empty state: "No comments yet — be the first!"

---

## Database Schema

### 1. Create `feed_comments` table

```sql
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_comments_feed_item ON feed_comments(feed_item_id);
CREATE INDEX idx_feed_comments_user ON feed_comments(user_id);
CREATE INDEX idx_feed_comments_parent ON feed_comments(parent_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Friends (and post owner) can read comments on shared feed items
CREATE POLICY "Users can read comments on visible feed items"
  ON feed_comments FOR SELECT
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

CREATE POLICY "Users can insert own comments"
  ON feed_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  USING (user_id = auth.uid());
```

### 2. RPC: `get_feed_comments`

Returns all comments for a feed item with author info. Returns a flat list ordered so that replies appear directly after their parent (parent by created_at ASC, then replies by created_at ASC). The client groups them using `parent_id`.

```sql
DROP FUNCTION IF EXISTS get_feed_comments(uuid);
CREATE FUNCTION get_feed_comments(p_feed_item_id uuid)
RETURNS TABLE (
  id UUID,
  feed_item_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_display_name TEXT,
  author_profile_picture TEXT,
  reply_to_display_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Verify caller can see this feed item (own post or friend's shared post)
  IF NOT EXISTS (
    SELECT 1 FROM feed_items fi
    WHERE fi.id = p_feed_item_id
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
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    fc.id,
    fc.feed_item_id,
    fc.user_id,
    fc.parent_id,
    fc.content,
    fc.created_at,
    u.display_name AS author_display_name,
    u.profile_picture AS author_profile_picture,
    pu.display_name AS reply_to_display_name
  FROM feed_comments fc
  JOIN users u ON u.id = fc.user_id
  LEFT JOIN feed_comments pc ON pc.id = fc.parent_id
  LEFT JOIN users pu ON pu.id = pc.user_id
  WHERE fc.feed_item_id = p_feed_item_id
  ORDER BY
    COALESCE(fc.parent_id, fc.id) ASC,   -- group replies under their parent
    fc.parent_id NULLS FIRST,             -- parent comes before its replies
    fc.created_at ASC;
END;
$$;
```

### 3. RPC: `add_feed_comment`

Accepts an optional `p_parent_id` for replies. If provided, validates that the parent is a top-level comment (not a reply itself) to enforce single-level nesting.

```sql
DROP FUNCTION IF EXISTS add_feed_comment(uuid, text, uuid);
CREATE FUNCTION add_feed_comment(p_feed_item_id uuid, p_content text, p_parent_id uuid DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Verify caller can see this feed item
  IF NOT EXISTS (
    SELECT 1 FROM feed_items fi
    WHERE fi.id = p_feed_item_id
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
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate content length
  IF char_length(p_content) < 1 OR char_length(p_content) > 500 THEN
    RAISE EXCEPTION 'Comment must be 1-500 characters';
  END IF;

  -- If replying, verify parent exists, belongs to same feed item, and is top-level
  IF p_parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM feed_comments
      WHERE id = p_parent_id
        AND feed_item_id = p_feed_item_id
        AND parent_id IS NULL              -- must be top-level (single-level replies only)
    ) THEN
      RAISE EXCEPTION 'Invalid parent comment';
    END IF;
  END IF;

  INSERT INTO feed_comments (feed_item_id, user_id, content, parent_id)
  VALUES (p_feed_item_id, auth.uid(), p_content, p_parent_id)
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$$;
```

### 4. RPC: `delete_feed_comment`

```sql
DROP FUNCTION IF EXISTS delete_feed_comment(uuid);
CREATE FUNCTION delete_feed_comment(p_comment_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM feed_comments
  WHERE id = p_comment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or not authorized';
  END IF;
END;
$$;
```

### 5. Update `get_friends_feed` to include comment count

Add `comment_count` to the existing RPC return type:

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
  user_has_liked BOOLEAN,
  comment_count BIGINT          -- NEW
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
    ) AS user_has_liked,
    COALESCE(cm.cnt, 0) AS comment_count       -- NEW
  FROM feed_items fi
  JOIN users u ON u.id = fi.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt FROM feed_likes WHERE feed_item_id = fi.id
  ) lk ON true
  LEFT JOIN LATERAL (                           -- NEW
    SELECT COUNT(*) AS cnt FROM feed_comments WHERE feed_item_id = fi.id
  ) cm ON true
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

---

## Types

```ts
// types/social-feed.ts — add to existing file

export type FeedComment = {
  id: string;
  feed_item_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_display_name: string;
  author_profile_picture: string | null;
  reply_to_display_name: string | null;
};
```

Update `SocialFeedItem` to include comment_count:

```ts
export type SocialFeedItem = {
  // ... existing fields
  comment_count: number;  // NEW
};
```

---

## Mobile Implementation

### Phase 1: Database Migration

#### 1.1 Migration file

`supabase/migrations/YYYYMMDDHHmmss_feed_comments.sql`

Contains: `feed_comments` table, RLS policies, indexes, `get_feed_comments` RPC, `add_feed_comment` RPC, `delete_feed_comment` RPC, updated `get_friends_feed` with `comment_count`.

### Phase 2: Database Functions

#### 2.1 Get comments

`database/social-feed/get-feed-comments.ts`

```ts
export async function getFeedComments(feedItemId: string): Promise<FeedComment[]> {
  const { data, error } = await supabase.rpc("get_feed_comments", {
    p_feed_item_id: feedItemId,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching comments",
      route: "/database/social-feed/get-feed-comments",
      method: "GET",
    });
    throw new Error("Error fetching comments");
  }

  return data as FeedComment[];
}
```

#### 2.2 Add comment

`database/social-feed/add-feed-comment.ts`

```ts
export async function addFeedComment(
  feedItemId: string,
  content: string,
  parentId: string | null = null,
): Promise<string> {
  const { data, error } = await supabase.rpc("add_feed_comment", {
    p_feed_item_id: feedItemId,
    p_content: content,
    p_parent_id: parentId,
  });

  if (error) {
    handleError(error, {
      message: "Error adding comment",
      route: "/database/social-feed/add-feed-comment",
      method: "POST",
    });
    throw new Error("Error adding comment");
  }

  return data as string;
}
```

#### 2.3 Delete comment

`database/social-feed/delete-feed-comment.ts`

```ts
export async function deleteFeedComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_feed_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting comment",
      route: "/database/social-feed/delete-feed-comment",
      method: "DELETE",
    });
    throw new Error("Error deleting comment");
  }
}
```

### Phase 3: React Query Hooks

#### 3.1 `useFeedComments`

`features/social-feed/hooks/useFeedComments.ts`

```ts
export default function useFeedComments(feedItemId: string | null) {
  return useQuery<FeedComment[]>({
    queryKey: ["feed-comments", feedItemId],
    queryFn: () => getFeedComments(feedItemId!),
    enabled: !!feedItemId,
  });
}
```

#### 3.2 `useAddComment`

`features/social-feed/hooks/useAddComment.ts`

Mutation with optimistic update:

```ts
export default function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedItemId, content, parentId }: { feedItemId: string; content: string; parentId: string | null }) =>
      addFeedComment(feedItemId, content, parentId),
    onMutate: async ({ feedItemId, content, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["feed-comments", feedItemId] });

      const previousComments = queryClient.getQueryData<FeedComment[]>(["feed-comments", feedItemId]);

      // Optimistic comment with temp ID
      const optimisticComment: FeedComment = {
        id: `temp-${Date.now()}`,
        feed_item_id: feedItemId,
        user_id: currentUserId,
        parent_id: parentId,
        content,
        created_at: new Date().toISOString(),
        author_display_name: currentUserName,
        author_profile_picture: currentUserPicture,
        reply_to_display_name: null, // filled on refetch
      };

      queryClient.setQueryData<FeedComment[]>(
        ["feed-comments", feedItemId],
        (old) => [...(old ?? []), optimisticComment],
      );

      // Also bump comment_count on the social feed card
      queryClient.setQueryData<InfiniteData<SocialFeedItem[]>>(
        ["social-feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === feedItemId
                  ? { ...item, comment_count: item.comment_count + 1 }
                  : item,
              ),
            ),
          };
        },
      );

      return { previousComments };
    },
    onError: (_err, { feedItemId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["feed-comments", feedItemId], context.previousComments);
      }
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
    onSettled: (_data, _err, { feedItemId }) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", feedItemId] });
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
```

#### 3.3 `useDeleteComment`

`features/social-feed/hooks/useDeleteComment.ts`

Mutation with optimistic removal:

```ts
export default function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; feedItemId: string }) =>
      deleteFeedComment(commentId),
    onMutate: async ({ commentId, feedItemId }) => {
      await queryClient.cancelQueries({ queryKey: ["feed-comments", feedItemId] });

      const previousComments = queryClient.getQueryData<FeedComment[]>(["feed-comments", feedItemId]);

      queryClient.setQueryData<FeedComment[]>(
        ["feed-comments", feedItemId],
        (old) => (old ?? []).filter((c) => c.id !== commentId),
      );

      // Decrement comment_count on the social feed card
      queryClient.setQueryData<InfiniteData<SocialFeedItem[]>>(
        ["social-feed"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === feedItemId
                  ? { ...item, comment_count: Math.max(0, item.comment_count - 1) }
                  : item,
              ),
            ),
          };
        },
      );

      return { previousComments };
    },
    onError: (_err, { feedItemId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["feed-comments", feedItemId], context.previousComments);
      }
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
    onSettled: (_data, _err, { feedItemId }) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", feedItemId] });
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
```

### Phase 4: UI Components

#### 4.1 Update `SocialFeedCardFooter`

Add comment count + button between the like button and details button:

```tsx
// Updated footer layout:
<View className="flex-row items-center justify-between px-4 py-2 border-t border-slate-700/50 mt-1">
  {/* Like button (existing) */}
  <AnimatedButton onPress={onToggleLike} className="flex-row items-center gap-2" hitSlop={10}>
    <Heart size={20} ... />
    <AppText ...>{likeText}</AppText>
  </AnimatedButton>

  {/* Comment button (NEW) */}
  <AnimatedButton onPress={onOpenComments} className="flex-row items-center gap-2" hitSlop={10}>
    <MessageCircle size={18} color="#64748b" />
    {item.comment_count > 0 && (
      <AppText className="text-slate-500 text-sm">{item.comment_count}</AppText>
    )}
  </AnimatedButton>

  {/* Details button (existing) */}
  <AnimatedButton onPress={onExpand} className="flex-row items-center gap-2" hitSlop={10}>
    <SquareArrowOutUpRight size={18} color="#64748b" />
    <AppText className="text-slate-500 text-sm">{t("social.details")}</AppText>
  </AnimatedButton>
</View>
```

#### 4.2 `CommentSheet` Component

`features/social-feed/components/CommentSheet.tsx`

Bottom sheet modal for viewing/adding comments. Uses `@gorhom/bottom-sheet` (already a project dependency).

```
+------------------------------------------+
|  Comments (2)                        [X] |
|------------------------------------------|
|  <ScrollView / FlatList>                 |
|                                          |
|  [avatar] FriendA              5m ago    |
|  Great session!                          |
|                                          |
|  [avatar] You                  2m ago    |
|  Thanks!                         [trash] |
|                                          |
|  -- or empty state --                    |
|  No comments yet                         |
|                                          |
|------------------------------------------|
|  [TextInput]                     [Send]  |
+------------------------------------------+
```

Key implementation details:
- `BottomSheetModal` with snap points at 50% and 90%
- `BottomSheetFlatList` for the comment list (scrollable within sheet)
- `BottomSheetTextInput` for the input (keyboard-aware within the sheet)
- Send button disabled when input is empty
- Send clears input, resets reply state, and scrolls to bottom
- Delete shows a small confirmation or immediately deletes (simple approach: immediate delete)

Reply state management:
- `replyingTo` state: `{ parentId: string; authorName: string } | null`
- When user taps "Reply" on a top-level comment, set `replyingTo` and show banner above input
- Banner: "Replying to FriendName [X]" — tapping [X] clears `replyingTo`
- On send: pass `replyingTo.parentId` as `parentId` to `useAddComment`, then clear `replyingTo`
- Data grouping: the RPC returns comments pre-sorted (parents first, replies under them), so the FlatList can render directly without client-side grouping

#### 4.3 `CommentItem` Component

`features/social-feed/components/CommentItem.tsx`

Handles both top-level comments and replies. Replies are indented and show `@ParentAuthor` prefix.

```tsx
type CommentItemProps = {
  comment: FeedComment;
  isOwnComment: boolean;
  onDelete: () => void;
  onReply: () => void;     // only shown on top-level comments
};

// Top-level comment
<View className="flex-row gap-3 px-4 py-3">
  <Image source={{ uri: comment.author_profile_picture }} className="w-7 h-7 rounded-full" />
  <View className="flex-1">
    <View className="flex-row items-center justify-between">
      <AppText className="text-sm font-semibold">{comment.author_display_name}</AppText>
      <View className="flex-row items-center gap-2">
        <AppText className="text-xs text-slate-500">{relativeTime}</AppText>
        {isOwnComment && (
          <AnimatedButton onPress={onDelete} hitSlop={8}>
            <Trash2 size={14} color="#64748b" />
          </AnimatedButton>
        )}
      </View>
    </View>
    <AppText className="text-sm mt-0.5">{comment.content}</AppText>
    {!comment.parent_id && (
      <AnimatedButton onPress={onReply} className="mt-1">
        <AppText className="text-xs text-slate-500">{t("social.reply")}</AppText>
      </AnimatedButton>
    )}
  </View>
</View>

// Reply (indented) — same structure but:
// - Extra left padding (pl-10)
// - Smaller avatar (w-6 h-6)
// - Shows "@ParentAuthor" prefix in content
// - No Reply button (can't reply to replies)
```

### Phase 5: Integration

#### 5.1 Wire into `SessionFeed.tsx`

Add state for the comment sheet:

```ts
const [commentFeedItemId, setCommentFeedItemId] = useState<string | null>(null);
```

Pass `onOpenComments` to `SocialFeedCard` -> `SocialFeedCardFooter`:

```tsx
<SocialFeedCard
  item={socialItem}
  onToggleLike={() => toggleLikeMutation(socialItem.id)}
  onExpand={() => setExpandedSocialItem(socialItem)}
  onOpenComments={() => setCommentFeedItemId(socialItem.id)}  // NEW
/>
```

Render `CommentSheet` at the bottom of SessionFeed:

```tsx
<CommentSheet
  feedItemId={commentFeedItemId}
  onClose={() => setCommentFeedItemId(null)}
/>
```

#### 5.2 Update `SocialFeedCard` props

Add `onOpenComments` prop and pass it through to the footer.

---

## Translations

### `locales/en/social.json` — add keys

```json
{
  "social": {
    "comments": "Comments",
    "comment": "comment",
    "commentPlural": "comments",
    "noComments": "No comments yet",
    "addComment": "Write a comment...",
    "send": "Send",
    "deleteComment": "Delete comment",
    "reply": "Reply",
    "replyingTo": "Replying to {{name}}"
  }
}
```

### `locales/fi/social.json` — add keys

```json
{
  "social": {
    "comments": "Kommentit",
    "comment": "kommentti",
    "commentPlural": "kommenttia",
    "noComments": "Ei vielä kommentteja",
    "addComment": "Kirjoita kommentti...",
    "send": "Lähetä",
    "deleteComment": "Poista kommentti",
    "reply": "Vastaa",
    "replyingTo": "Vastaus käyttäjälle {{name}}"
  }
}
```

---

## File Structure

```
mobile/
  database/
    social-feed/
      get-feed-comments.ts        # NEW
      add-feed-comment.ts         # NEW
      delete-feed-comment.ts      # NEW
  features/
    social-feed/
      hooks/
        useFeedComments.ts        # NEW
        useAddComment.ts          # NEW
        useDeleteComment.ts       # NEW
      components/
        CommentSheet.tsx          # NEW
        CommentItem.tsx           # NEW
        SocialFeedCardFooter.tsx  # MODIFIED — add comment button
        SocialFeedCard.tsx        # MODIFIED — pass onOpenComments
  types/
    social-feed.ts               # MODIFIED — add FeedComment type + comment_count
  locales/
    en/social.json               # MODIFIED — add comment keys
    fi/social.json               # MODIFIED — add comment keys
supabase/
  migrations/
    YYYYMMDDHHmmss_feed_comments.sql  # NEW
```

---

## Implementation Order

### Step 1: Database migration
- Create `feed_comments` table with RLS policies and indexes
- Create `get_feed_comments`, `add_feed_comment`, `delete_feed_comment` RPCs
- Update `get_friends_feed` to return `comment_count`

### Step 2: Types + database functions
- Add `FeedComment` type and `comment_count` to `SocialFeedItem`
- Create database functions (get, add, delete)

### Step 3: React Query hooks
- `useFeedComments` — query for loading comments
- `useAddComment` — mutation with optimistic update
- `useDeleteComment` — mutation with optimistic removal

### Step 4: Comment UI
- `CommentItem` component
- `CommentSheet` component (bottom sheet with list + input)
- Update `SocialFeedCardFooter` with comment button + count
- Update `SocialFeedCard` props

### Step 5: Integration
- Wire `CommentSheet` into `SessionFeed.tsx`
- Pass `onOpenComments` through the component tree
- Translations (en + fi)

### Step 6: Polish
- Keyboard handling in the bottom sheet
- Scroll to bottom on new comment
- Empty state styling
- Character count indicator near 500 limit

---

## Edge Cases

- **No comments**: Show "No comments yet" empty state in sheet
- **Deleted post**: CASCADE delete removes feed_item + comments
- **User unfriends**: Comments become invisible via RLS (same as likes)
- **Post made private**: Comments remain in DB but are hidden by RLS (visibility check in `get_feed_comments`)
- **Rapid posting**: Optimistic update shows comment immediately; `onSettled` refetches to sync
- **Empty input**: Send button disabled when input is empty or whitespace-only
- **Long text**: 500 character limit enforced both client-side (TextInput maxLength) and server-side (CHECK constraint + RPC validation)
- **Own comments on own shared posts**: Post owner can see and add comments on their own shared posts (the `get_feed_comments` RPC allows `fi.user_id = auth.uid()`)
- **Deleting a parent comment**: CASCADE deletes all its replies (ON DELETE CASCADE on `parent_id` FK). Comment count updates on refetch.
- **Replying to a reply**: Not allowed — Reply button only appears on top-level comments. The RPC enforces this with a `parent_id IS NULL` check on the parent.

---

## Future Enhancements

- **Comment notifications**: Push notification when someone comments on your shared post. Insert into `notifications` table with `type: 'comment'`.
- **Comment reactions**: Quick emoji reactions on individual comments (like Slack).
- **Comments on personal feed**: Allow the post owner to see comment count on their own feed cards (not just the social feed view).
