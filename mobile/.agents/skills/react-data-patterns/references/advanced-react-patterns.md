---
title: Advanced React Patterns
impact: MEDIUM
tags: advanced, hooks, refs, event-handlers, initialization, useEffectEvent
---

# Advanced React Patterns

## 1. Store Event Handlers in Refs

**Impact: LOW** — Stable subscriptions without re-runs.

Store callbacks in refs when used in effects that shouldn't re-subscribe on callback changes.

**Incorrect (re-subscribes on every render):**

```tsx
function useAppStateChange(handler: (status: AppStateStatus) => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', handler)
    return () => sub.remove()
  }, [handler]) // re-subscribes when handler changes
}
```

**Correct (stable subscription):**

```tsx
function useAppStateChange(handler: (status: AppStateStatus) => void) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const listener = (status: AppStateStatus) => handlerRef.current(status)
    const sub = AppState.addEventListener('change', listener)
    return () => sub.remove()
  }, [])
}
```

**Alternative: useEffectEvent (React 19+):**

```tsx
import { useEffectEvent } from 'react'

function useAppStateChange(handler: (status: AppStateStatus) => void) {
  const onStateChange = useEffectEvent(handler)

  useEffect(() => {
    const sub = AppState.addEventListener('change', onStateChange)
    return () => sub.remove()
  }, [])
}
```

---

## 2. Initialize App Once, Not Per Mount

**Impact: LOW-MEDIUM** — Avoids duplicate initialization in development.

Do not put app-wide initialization inside `useEffect([])`. Components can remount (especially in React Strict Mode) and effects will re-run. Use a module-level guard.

**Incorrect (runs twice in dev, re-runs on remount):**

```tsx
function App() {
  useEffect(() => {
    loadFromStorage()
    checkAuthToken()
  }, [])
}
```

**Correct (once per app load):**

```tsx
let didInit = false

function App() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    loadFromStorage()
    checkAuthToken()
  }, [])
}
```

---

## 3. useEffectEvent for Stable Callback Refs

**Impact: LOW** — Prevents effect re-runs while avoiding stale closures.

Access latest values in callbacks without adding them to dependency arrays.

**Incorrect (effect re-runs on every callback change):**

```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), 300)
    return () => clearTimeout(timeout)
  }, [query, onSearch]) // re-runs when onSearch changes
}
```

**Correct (using useEffectEvent):**

```tsx
import { useEffectEvent } from 'react'

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')
  const onSearchEvent = useEffectEvent(onSearch)

  useEffect(() => {
    const timeout = setTimeout(() => onSearchEvent(query), 300)
    return () => clearTimeout(timeout)
  }, [query]) // no need for onSearch dependency
}
```

**Fallback (without useEffectEvent):**

```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const timeout = setTimeout(() => onSearchRef.current(query), 300)
    return () => clearTimeout(timeout)
  }, [query])
}
```

---

## References

- [Initializing the application](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application)
- [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)
