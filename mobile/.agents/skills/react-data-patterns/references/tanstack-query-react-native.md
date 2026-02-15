---
title: TanStack Query Patterns for React Native
impact: CRITICAL
tags: tanstack-query, react-query, data-fetching, caching, mutations, react-native
---

# TanStack Query Patterns for React Native

## 1. useQuery — Server State with Caching

Use `useQuery` for any server data that needs caching, deduplication, and automatic refetching.

**Incorrect (manual fetch with useState/useEffect):**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // No caching, no deduplication, no refetch on focus
}
```

**Correct (useQuery with automatic caching):**

```tsx
import { useQuery } from '@tanstack/react-query'

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
}
```

**Benefits:** automatic caching, request deduplication across components, background refetching, loading/error states, garbage collection.

### Query Key Best Practices

```tsx
// Hierarchical keys for related data
queryKey: ['users']                    // all users
queryKey: ['users', userId]            // single user
queryKey: ['users', userId, 'posts']   // user's posts
queryKey: ['users', { status: 'active' }] // filtered

// Invalidate all user-related queries at once
queryClient.invalidateQueries({ queryKey: ['users'] })
```

### Stale Time Configuration

```tsx
// Data that rarely changes
const { data } = useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity,  // never refetch automatically
})

// Data that changes frequently
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 30 * 1000,  // consider stale after 30s
})

// Default: staleTime: 0 (always stale, refetch on mount/focus)
```

---

## 2. useMutation — Mutations with Cache Invalidation

Use `useMutation` instead of manual async functions for mutations. It provides loading states, error handling, optimistic updates, and automatic cache invalidation.

**Incorrect (manual mutation with refetch):**

```tsx
function SaveButton({ data }) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveData(data)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['feed'] }),
        queryClient.refetchQueries({ queryKey: ['my-data'] }),
      ])
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }
}
```

**Correct (useMutation with invalidation):**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function SaveButton({ data }) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: saveData,
    onSuccess: () => {
      // Invalidate triggers refetch only if query is active
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['my-data'] })
    },
    onError: (err) => {
      showError(err.message)
    },
  })

  return (
    <Pressable onPress={() => mutate(data)} disabled={isPending}>
      <AppText>{isPending ? 'Saving...' : 'Save'}</AppText>
    </Pressable>
  )
}
```

**Why `invalidateQueries` over `refetchQueries`:**
- `invalidateQueries` marks queries as stale and only refetches if they're actively mounted
- `refetchQueries` forces a refetch even for unmounted queries (wasteful)

### Optimistic Updates

```tsx
const { mutate } = useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (itemId) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['items'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['items'])

    // Optimistically update
    queryClient.setQueryData(['items'], (old) =>
      old.map(item =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    )

    return { previous }
  },
  onError: (_err, _itemId, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previous)
  },
  onSettled: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

---

## 3. useInfiniteQuery — Paginated Lists

Use `useInfiniteQuery` for paginated feeds and lists (FlashList/FlatList).

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => getFeed({ page: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: Infinity,
  })
}

// In component with FlashList
function FeedScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed()

  const items = data?.pages.flatMap(page => page.items) ?? []

  return (
    <FlashList
      data={items}
      renderItem={({ item }) => <FeedCard item={item} />}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      estimatedItemSize={120}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
    />
  )
}
```

---

## 4. React Native Focus Manager

React Native doesn't have `window` focus events. Configure the focus manager to refetch stale queries when the app returns from background.

```tsx
// In your app's root _layout.tsx or providers file
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
import { focusManager } from '@tanstack/react-query'

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

// Inside your root component:
useEffect(() => {
  const subscription = AppState.addEventListener('change', onAppStateChange)
  return () => subscription.remove()
}, [])
```

This makes queries with finite `staleTime` automatically refetch when the user returns to the app.

---

## 5. Online Manager

Track network status so TanStack Query can pause/resume queries when offline.

```tsx
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})
```

When offline:
- New queries are paused (not failed)
- Mutations are paused and retried when back online
- No unnecessary error states for network issues

---

## 6. QueryClient Configuration

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (won't refetch)
      staleTime: 5 * 60 * 1000,  // 5 minutes

      // How long inactive query data stays in cache
      gcTime: 10 * 60 * 1000,  // 10 minutes

      // Retry failed queries
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch when app comes to foreground (requires Focus Manager setup)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
})
```

### When to Override Defaults

```tsx
// Static config data — never refetch
useQuery({ queryKey: ['config'], queryFn: fetchConfig, staleTime: Infinity })

// Real-time data — always fresh
useQuery({ queryKey: ['messages'], queryFn: fetchMessages, staleTime: 0 })

// Expensive query — keep in cache longer
useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics, gcTime: 30 * 60 * 1000 })
```

---

## 7. Query Deduplication

Multiple components using the same `queryKey` share a single request automatically.

```tsx
// Both components share ONE network request
function Header() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  return <AppText>{user?.name}</AppText>
}

function Sidebar() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  return <AppText>{user?.email}</AppText>
}
```

No need for context providers or prop drilling to share server data.

---

## References

- [TanStack Query - React Native](https://tanstack.com/query/v5/docs/framework/react/react-native)
- [TanStack Query v5 Documentation](https://tanstack.com/query/v5/docs)
