---
title: Async Data Patterns
impact: HIGH
tags: async, parallelization, promises, waterfalls, data-fetching
---

# Async Data Patterns

## 1. Promise.all() for Independent Operations

**Impact: CRITICAL** — 2-10x improvement.

When async operations have no interdependencies, execute them concurrently.

**Incorrect (sequential execution, 3 round trips):**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
// Total time: fetchUser + fetchPosts + fetchComments
```

**Correct (parallel execution, 1 round trip):**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
// Total time: max(fetchUser, fetchPosts, fetchComments)
```

---

## 2. Dependency-Based Parallelization

**Impact: CRITICAL** — 2-10x improvement.

For operations with partial dependencies, start independent operations immediately and chain only what's needed.

**Incorrect (profile waits for config unnecessarily):**

```typescript
const [user, config] = await Promise.all([fetchUser(), fetchConfig()])
const profile = await fetchProfile(user.id) // config finished before this starts
```

**Correct (config and profile run in parallel):**

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),     // runs in parallel with both user and profile
  profilePromise
])
```

### Timeline Comparison

```
Incorrect:
  |-- fetchUser --|-- fetchConfig --|-- fetchProfile --|
  Total: 300ms

Correct:
  |-- fetchUser --|-- fetchProfile --|
  |-- fetchConfig --|
  Total: 200ms
```

---

## 3. Promise.allSettled() for Non-Critical Operations

When some operations can fail without blocking others, use `Promise.allSettled()`.

```typescript
const results = await Promise.allSettled([
  fetchUserProfile(),
  fetchNotifications(),
  fetchRecommendations(),  // non-critical, can fail
])

const profile = results[0].status === 'fulfilled' ? results[0].value : null
const notifications = results[1].status === 'fulfilled' ? results[1].value : []
const recommendations = results[2].status === 'fulfilled' ? results[2].value : []
```

---

## 4. Cache Invalidation After Parallel Mutations

When performing multiple mutations, invalidate related queries after all mutations complete.

```typescript
async function saveWorkout(session: GymSession, notes: string) {
  // Run independent mutations in parallel
  await Promise.all([
    saveGymSession(session),
    saveNotes(notes),
  ])

  // Invalidate all related queries after both succeed
  await queryClient.invalidateQueries({ queryKey: ['feed'] })
}
```

---

## 5. Avoid Waterfall Fetches in Components

Don't chain data fetching across parent and child components.

**Incorrect (child waits for parent to render):**

```tsx
function ParentScreen() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })

  if (!user) return <ActivityIndicator />
  return <ChildComponent userId={user.id} />
}

function ChildComponent({ userId }: { userId: string }) {
  // This doesn't start until parent finishes fetching
  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchPosts(userId),
  })
}
```

**Correct (prefetch or parallel queries):**

```tsx
function ParentScreen() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })

  // Prefetch posts as soon as we have the user id
  useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['posts', user.id],
        queryFn: () => fetchPosts(user.id),
      })
    }
  }, [user?.id])

  if (!user) return <ActivityIndicator />
  return <ChildComponent userId={user.id} />
}
```

---

## References

- [TanStack Query - Prefetching](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)
