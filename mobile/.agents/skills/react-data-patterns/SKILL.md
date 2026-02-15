---
name: react-data-patterns
description: Data fetching with TanStack Query, React re-render optimization, JS performance patterns, and async best practices for React Native. Covers useQuery, useMutation, cache invalidation, React Native focus/online managers, derived state, memoization, functional setState, and JavaScript performance optimizations.
license: MIT
metadata:
  tags: react-native, tanstack-query, react-query, data-fetching, performance, re-renders, optimization
---

# React Data Patterns for React Native

## Overview

Data fetching, caching, re-render optimization, and JavaScript performance patterns for React Native applications. Complements the `react-native-best-practices` skill (which covers FPS, TTI, bundle size, memory, animations, and native modules).

## When to Apply

Reference these guidelines when:
- Setting up or using TanStack Query (React Query)
- Implementing data fetching, caching, or mutations
- Optimizing component re-renders
- Writing performance-sensitive JavaScript
- Handling async operations (parallel fetching, dependency chains)
- Setting up offline support or app focus refetching

## Priority-Ordered Guidelines

| Priority | Category | Impact | Reference |
|----------|----------|--------|-----------|
| 1 | TanStack Query for React Native | CRITICAL | `tanstack-query-react-native.md` |
| 2 | Re-render Optimization | HIGH | `rerender-patterns.md` |
| 3 | Async Data Patterns | HIGH | `async-data-patterns.md` |
| 4 | JS Performance | MEDIUM | `js-performance-patterns.md` |
| 5 | Advanced React Patterns | MEDIUM | `advanced-react-patterns.md` |

## Quick Reference

### TanStack Query

```tsx
// useQuery - server state with automatic caching
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetchUsers(),
})

// useMutation - with cache invalidation
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})

// useInfiniteQuery - paginated lists
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam = 0 }) => getFeed({ page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextPage,
})
```

### React Native Focus/Online Manager

```tsx
import { focusManager, onlineManager } from '@tanstack/react-query'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

// Refetch on app focus
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active')
  })
  return () => sub.remove()
})

// Track online status
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})
```

### Re-render Optimization

- Derive state during render, not in effects
- Use functional `setState` for stable callbacks
- Use lazy state initialization for expensive values
- Narrow effect dependencies to primitives
- Use `useRef` for transient values that don't need re-renders
- Use `startTransition` for non-urgent updates

### Async Patterns

```tsx
// Parallel independent operations
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()])

// Dependency-based parallelization
const userPromise = fetchUser()
const profilePromise = userPromise.then(u => fetchProfile(u.id))
const [user, config, profile] = await Promise.all([
  userPromise, fetchConfig(), profilePromise
])
```

## Problem -> Skill Mapping

| Problem | Start With |
|---------|------------|
| Need data fetching/caching | `tanstack-query-react-native.md` |
| Manual refetch after mutations | `tanstack-query-react-native.md` (useMutation section) |
| Stale data after app background | `tanstack-query-react-native.md` (Focus Manager) |
| Too many re-renders | `rerender-patterns.md` |
| Slow list rendering | `rerender-patterns.md` (memo, derived state) |
| Sequential API calls | `async-data-patterns.md` |
| Slow loops/lookups | `js-performance-patterns.md` |
| Effect re-runs too often | `advanced-react-patterns.md` |

## References

| File | Impact | Description |
|------|--------|-------------|
| [tanstack-query-react-native.md](references/tanstack-query-react-native.md) | CRITICAL | TanStack Query patterns for React Native |
| [rerender-patterns.md](references/rerender-patterns.md) | HIGH | React re-render optimization patterns |
| [async-data-patterns.md](references/async-data-patterns.md) | HIGH | Parallel fetching and dependency chains |
| [js-performance-patterns.md](references/js-performance-patterns.md) | MEDIUM | JavaScript performance optimizations |
| [advanced-react-patterns.md](references/advanced-react-patterns.md) | MEDIUM | Advanced React hook patterns |

## Attribution

TanStack Query patterns based on [TanStack Query documentation](https://tanstack.com/query).
React and JS patterns adapted from Vercel Engineering's React best practices.
