# Friends Feature (Mobile)

## Overview
Implement a complete friends system on mobile, matching the web app's functionality. The database tables (`friends`, `friend_requests`) and RLS policies already exist. The mobile codebase has partial scaffolding: database functions in `database/friend/`, basic components in `features/friends/`, a placeholder page at `app/menu/friends/index.tsx`, and types in `types/models.ts`. This spec covers finishing and wiring everything together.

## Current State

### What exists (database — ready)
- `friends` table: `id`, `user1_id`, `user2_id`, `created_at` (user IDs stored in sorted order)
- `friend_requests` table: `id`, `sender_id`, `receiver_id`, `status` (pending/accepted/rejected), `created_at`
- RLS policies for both tables (read own, insert own, delete own, receiver can update)
- Users table policy allowing authenticated users to read profiles

### What exists (mobile — partial, needs work)
| File | Status | Issues |
|------|--------|--------|
| `database/friend/send-request.ts` | Exists | Works but error messages are hardcoded English, no translation keys returned |
| `database/friend/get-friends.ts` | Exists | Only fetches `id, user1_id, user2_id` — missing user join for display_name/profile_picture |
| `database/friend/accept.ts` | Exists | **Not atomic** — update + insert are separate calls, broken state if insert fails |
| `database/friend/delete-friend.ts` | Exists | **Not atomic** — 3 separate calls (read, delete, cleanup), orphaned records if partial failure |
| `features/friends/FriendRequestForm.tsx` | Exists | Hardcoded English strings, no translations |
| `features/friends/FriendCard.tsx` | Exists | Uses `Image` with broken fallback (`/default-avatar.png` web path), no translations |
| `app/menu/friends/index.tsx` | Exists | Broken — references `Friends.map()` on the type instead of data, no data fetching |
| `app/menu/index.tsx` | Exists | Friends link is commented out |
| `types/models.ts` | Exists | `FriendRequest` and `Friends` types defined |
| **Missing:** `database/friend/get-friend-requests.ts` | Does not exist | Need a function to fetch pending incoming requests |
| **Missing:** `database/friend/reject-request.ts` | Does not exist | Need a function to reject/delete friend requests |

## Goal
A fully working friends system with:
1. **Friends page** — send requests, view/accept/reject pending requests, view friends list, delete friends
2. **Proper translations** (EN + FI)
3. **React Query** for data fetching and cache management

## User Flow

```
Menu Page
├── "Friends" link (currently commented out → uncomment)
│
└── Friends Page (/menu/friends)
    ├── Send Friend Request form (username or UUID input)
    │   └── Submit → validates → creates pending request → success toast
    │
    ├── Pending Requests section (only visible when requests exist)
    │   └── Each request: sender name, date, Accept / Reject buttons
    │       ├── Accept → creates friendship, removes request → toast
    │       └── Reject → deletes request → toast
    │
    └── Friends List (scrollable)
        └── Each friend: profile picture, display name, delete button
            └── Delete → confirmation → removes friendship → toast
```

## Implementation

### 0. Create `accept_friend_request` RPC (Supabase migration)

The current `accept.ts` does two separate operations (update request status + insert friendship) with no transaction. If the insert fails after the update succeeds, the request is stuck as "accepted" with no friendship — broken state with no recovery.

Create a migration: `supabase/migrations/20260228200000_accept_friend_request_rpc.sql`

```sql
DROP FUNCTION IF EXISTS accept_friend_request(uuid);
CREATE FUNCTION accept_friend_request(p_sender_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_receiver_id uuid := auth.uid();
  v_user1 uuid;
  v_user2 uuid;
BEGIN
  -- Update the request status
  UPDATE friend_requests
  SET status = 'accepted'
  WHERE sender_id = p_sender_id
    AND receiver_id = v_receiver_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending friend request found';
  END IF;

  -- Sort IDs for consistent storage
  IF p_sender_id < v_receiver_id THEN
    v_user1 := p_sender_id;
    v_user2 := v_receiver_id;
  ELSE
    v_user1 := v_receiver_id;
    v_user2 := p_sender_id;
  END IF;

  -- Create the friendship
  INSERT INTO friends (user1_id, user2_id)
  VALUES (v_user1, v_user2);
END;
$$;
```

Both operations run in a single transaction — if anything fails, the whole thing rolls back. `SECURITY INVOKER` so it can bypass RLS internally.

Also create a `delete_friend` RPC in the same migration for the 3-step delete (read other user ID, delete friendship, cleanup requests):

```sql
DROP FUNCTION IF EXISTS delete_friend(uuid);
CREATE FUNCTION delete_friend(p_friend_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_other_id uuid;
  v_row friends%ROWTYPE;
BEGIN
  -- Fetch and verify ownership
  SELECT * INTO v_row
  FROM friends
  WHERE id = p_friend_id
    AND (user1_id = v_user_id OR user2_id = v_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  -- Determine the other user
  IF v_row.user1_id = v_user_id THEN
    v_other_id := v_row.user2_id;
  ELSE
    v_other_id := v_row.user1_id;
  END IF;

  -- Delete the friendship
  DELETE FROM friends WHERE id = p_friend_id;

  -- Cleanup accepted friend requests in both directions
  DELETE FROM friend_requests
  WHERE status = 'accepted'
    AND (
      (sender_id = v_user_id AND receiver_id = v_other_id)
      OR (sender_id = v_other_id AND receiver_id = v_user_id)
    );
END;
$$;
```

### 1. Fix `database/friend/get-friends.ts`

The current version only returns raw IDs. Rewrite to match the web pattern — join with `users` table and return the "other user" info.

```ts
// Select with user joins (same pattern as web)
const { data: friends } = await supabase
  .from("friends")
  .select(`
    id, user1_id, user2_id, created_at,
    user1:users!friends_user1_id_fkey(display_name, id, profile_picture),
    user2:users!friends_user2_id_fkey(display_name, id, profile_picture)
  `)
  .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
  .order("created_at", { ascending: false });

// Map to return the other user's info
const friendsWithOtherUser = friends.map((friend) => {
  const otherUser = friend.user1_id === session.user.id ? friend.user2 : friend.user1;
  return { id: friend.id, created_at: friend.created_at, user: otherUser };
});
```

Return type should match `Friends[]` from `types/models.ts`.

### 2. Create `database/friend/get-friend-requests.ts`

New file. Fetch pending incoming friend requests for the current user.

```ts
// Fetch pending requests where current user is the receiver
const { data: requests } = await supabase
  .from("friend_requests")
  .select("id, sender_id, created_at, sender:users!friend_requests_sender_id_fkey(display_name, id)")
  .eq("receiver_id", session.user.id)
  .eq("status", "pending")
  .order("created_at", { ascending: false });
```

Return type should match `FriendRequest[]` from `types/models.ts`.

### 3. Create `database/friend/reject-request.ts`

New file. Delete/reject a pending friend request.

```ts
export async function rejectFriendRequest(requestId: string) {
  // Delete the friend request row
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("receiver_id", session.user.id);
  // ...error handling
  return { success: true };
}
```

### 4. Update `database/friend/send-request.ts`

Return translation-friendly error keys instead of hardcoded English strings:

| Current message | Change to key |
|----------------|---------------|
| `"You cannot send a friend request to yourself"` | `"cannotSendToSelf"` |
| `"Friend request already exists"` | `"requestAlreadyExists"` |
| `"Error checking friendship"` (when already friends) | `"alreadyFriends"` |
| `"Error fetching user"` (user not found) | `"userNotFound"` |

Return `{ error: true, message: "<key>" }` so the component can look up `t("friends.<key>")`.

### 5. Create `features/friends/hooks/useFriends.ts`

React Query hook for the friends list.

```ts
export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
}
```

### 6. Create `features/friends/hooks/useFriendRequests.ts`

React Query hook for pending incoming requests.

```ts
export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: getFriendRequests,
  });
}
```

### 7. Create `features/friends/hooks/useSendFriendRequest.ts`

Mutation hook for sending a friend request.

```ts
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
```

### 8. Rewrite `database/friend/accept.ts` to use RPC

Replace the two separate Supabase calls with a single RPC call:

```ts
const { error } = await supabase.rpc("accept_friend_request", {
  p_sender_id: sender_id,
});
```

### 9. Rewrite `database/friend/delete-friend.ts` to use RPC

Replace the three separate calls with a single RPC call:

```ts
const { error } = await supabase.rpc("delete_friend", {
  p_friend_id: friendId,
});
```

### 10. Create `features/friends/hooks/useAcceptFriendRequest.ts`

Mutation hook for accepting.

```ts
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (senderId: string) => acceptFriendRequest(senderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
```

### 11. Create `features/friends/hooks/useRejectFriendRequest.ts`

Mutation hook for rejecting.

```ts
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rejectFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}
```

### 12. Create `features/friends/hooks/useDeleteFriend.ts`

Mutation hook for deleting a friend.

```ts
export function useDeleteFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => deleteFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
```

### 13. Update `features/friends/FriendRequestForm.tsx`

- Use `useSendFriendRequest` mutation hook instead of calling the DB function directly
- Add translations for all strings
- Map returned error keys to translated messages via `t("friends.<key>")`
- Show error toast with translated message on failure
- Show success toast with translated message on success
- Add `Keyboard.dismiss` wrapper
- Use proper loading state from mutation

### 14. Update `features/friends/FriendCard.tsx`

- Use `useDeleteFriend` mutation hook instead of calling the DB function directly
- Fix profile picture: use `require("@/assets/images/default-avatar.png")` fallback (not web path)
- Add translations for confirmation dialog and toast messages
- Use `AnimatedButton` for the delete action (instead of raw icon `onPress`)

### 15. Rewrite `app/menu/friends/index.tsx`

Complete rewrite — currently broken.

```
┌──────────────────────────────────┐
│         Friends                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Send Friend Request        │  │
│  │ [username/id input]        │  │
│  │ [Send Request button]      │  │
│  └────────────────────────────┘  │
│                                  │
│  Pending Requests (if any)       │
│  ┌────────────────────────────┐  │
│  │ SenderName                 │  │
│  │ [Accept]  [Reject]         │  │
│  └────────────────────────────┘  │
│                                  │
│  My Friends                      │
│  ┌────────────────────────────┐  │
│  │ 🖼 Friend Name    [🗑]     │  │
│  │ 🖼 Friend Name    [🗑]     │  │
│  │ 🖼 Friend Name    [🗑]     │  │
│  └────────────────────────────┘  │
│                                  │
│  (empty state if no friends)     │
└──────────────────────────────────┘
```

- Wrap with `ModalPageWrapper`
- Use `useFriends` hook to fetch friends list
- Use `useFriendRequests` hook to fetch pending incoming requests
- Show loading state while fetching
- Show "Pending Requests" section with accept/reject buttons (only when requests exist)
- Show empty state text when no friends
- Render `FriendRequestForm` at top
- Render pending requests section below the form
- Render `FriendCard` list below pending requests
- Wrap with `Pressable onPress={Keyboard.dismiss}` for keyboard dismissal
- Use `ScrollView` or `FlatList` for friends list

### 16. Uncomment friends link in `app/menu/index.tsx`

Uncomment the Friends `LinkButton` (line 19-21) and add the `ContactRound` import.

### 17. Add translations

#### `locales/en/friends.json` (new file)
```json
{
  "friends": {
    "title": "Friends",
    "myFriends": "My Friends",
    "noFriends": "No friends yet",
    "sendRequest": "Send Request",
    "sendFriendRequest": "Send Friend Request",
    "placeholder": "Enter friend's username or id",
    "requestSentSuccess": "Friend request sent!",
    "cannotSendToSelf": "You cannot send a friend request to yourself",
    "requestAlreadyExists": "Friend request already pending",
    "alreadyFriends": "You are already friends",
    "userNotFound": "User not found",
    "sendError": "Failed to send friend request",
    "deleteConfirmation": "Remove this friend?",
    "deleteSuccess": "Friend removed",
    "deleteError": "Failed to remove friend",
    "pendingRequests": "Pending Requests",
    "requestFrom": "Friend request from",
    "accept": "Accept",
    "reject": "Reject",
    "acceptSuccess": "Friend request accepted!",
    "acceptError": "Failed to accept request",
    "rejectSuccess": "Friend request declined",
    "rejectError": "Failed to decline request"
  }
}
```

#### `locales/fi/friends.json` (new file)
```json
{
  "friends": {
    "title": "Kaverit",
    "myFriends": "Kaverini",
    "noFriends": "Ei vielä kavereita",
    "sendRequest": "Lähetä pyyntö",
    "sendFriendRequest": "Lähetä kaveripyyntö",
    "placeholder": "Syötä kaverin käyttäjänimi tai id",
    "requestSentSuccess": "Kaveripyyntö lähetetty!",
    "cannotSendToSelf": "Et voi lähettää kaveripyyntöä itsellesi",
    "requestAlreadyExists": "Kaveripyyntö on jo lähetetty",
    "alreadyFriends": "Olette jo kavereita",
    "userNotFound": "Käyttäjää ei löytynyt",
    "sendError": "Kaveripyynnön lähetys epäonnistui",
    "deleteConfirmation": "Poista tämä kaveri?",
    "deleteSuccess": "Kaveri poistettu",
    "deleteError": "Kaverin poisto epäonnistui",
    "pendingRequests": "Saapuneet pyynnöt",
    "requestFrom": "Kaveripyyntö käyttäjältä",
    "accept": "Hyväksy",
    "reject": "Hylkää",
    "acceptSuccess": "Kaveripyyntö hyväksytty!",
    "acceptError": "Pyynnön hyväksyminen epäonnistui",
    "rejectSuccess": "Kaveripyyntö hylätty",
    "rejectError": "Pyynnön hylkääminen epäonnistui"
  }
}
```

#### `locales/en/menu.json` — add key
```json
"friends": "Friends"
```
(inside the `"menu"` object)

#### `locales/fi/menu.json` — add key
```json
"friends": "Kaverit"
```

### 18. Register translation namespace

Add `friends` namespace to `app/i18n.ts` so i18next loads the new JSON files.

## Files to Change

| File | Action |
|------|--------|
| `supabase/migrations/20260228200000_friend_rpcs.sql` | **Create** — `accept_friend_request` and `delete_friend` RPCs |
| `database/friend/get-friends.ts` | **Rewrite** — add user join, return `Friends[]` |
| `database/friend/get-friend-requests.ts` | **Create** — fetch pending incoming requests |
| `database/friend/reject-request.ts` | **Create** — reject/delete a friend request |
| `database/friend/send-request.ts` | **Update** — return error keys instead of English strings |
| `database/friend/accept.ts` | **Rewrite** — use `accept_friend_request` RPC instead of 2 separate calls |
| `database/friend/delete-friend.ts` | **Rewrite** — use `delete_friend` RPC instead of 3 separate calls |
| `features/friends/hooks/useFriends.ts` | **Create** — React Query hook |
| `features/friends/hooks/useFriendRequests.ts` | **Create** — React Query hook |
| `features/friends/hooks/useSendFriendRequest.ts` | **Create** — mutation hook |
| `features/friends/hooks/useAcceptFriendRequest.ts` | **Create** — mutation hook |
| `features/friends/hooks/useRejectFriendRequest.ts` | **Create** — mutation hook |
| `features/friends/hooks/useDeleteFriend.ts` | **Create** — mutation hook |
| `features/friends/FriendRequestForm.tsx` | **Update** — use hooks, translations, keyboard dismiss |
| `features/friends/FriendCard.tsx` | **Update** — use hooks, fix avatar fallback, translations |
| `app/menu/friends/index.tsx` | **Rewrite** — proper page with data fetching |
| `app/menu/index.tsx` | **Update** — uncomment friends link |
| `locales/en/friends.json` | **Create** — English translations |
| `locales/fi/friends.json` | **Create** — Finnish translations |
| `locales/en/menu.json` | **Update** — add "friends" key |
| `locales/fi/menu.json` | **Update** — add "friends" key |
| `app/i18n.ts` | **Update** — register friends namespace |

## Edge Cases
- **No friends**: Show empty state with friendly message
- **No pending requests**: Hide the "Pending Requests" section entirely
- **Self-request**: Server returns error key, form shows translated error
- **Duplicate request**: Server returns error key, form shows translated error
- **Already friends**: Server returns error key, form shows translated error
- **User not found**: Server returns error key, form shows translated error
- **No profile picture**: Use default avatar from `@/assets/images/default-avatar.png`
- **Network errors**: Show generic error toast, log to Sentry via `handleError`
- **Optimistic updates**: Consider optimistic removal on delete for snappy UX (remove from list immediately, roll back on error)
