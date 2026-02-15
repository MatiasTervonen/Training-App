---
title: React Re-render Optimization Patterns
impact: HIGH
tags: rerender, optimization, memo, derived-state, setState, useRef, transitions
---

# React Re-render Optimization Patterns

## 1. Calculate Derived State During Rendering

**Impact: MEDIUM** — Avoids redundant renders and state drift.

If a value can be computed from current props/state, do not store it in state or update it in an effect. Derive it during render.

**Incorrect (redundant state and effect):**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    setFullName(firstName + ' ' + lastName)
  }, [firstName, lastName])

  return <AppText>{fullName}</AppText>
}
```

**Correct (derive during render):**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const fullName = firstName + ' ' + lastName

  return <AppText>{fullName}</AppText>
}
```

### Subscribe to Derived Booleans

Subscribe to derived boolean state instead of continuous values to reduce re-render frequency.

**Incorrect (re-renders on every dimension change):**

```tsx
function Sidebar() {
  const { width } = useWindowDimensions() // updates continuously
  const isMobile = width < 768
  return <View className={isMobile ? 'w-full' : 'w-64'} />
}
```

**Correct (re-renders only when boolean changes):**

```tsx
function useIsMobile(breakpoint = 768) {
  const { width } = useWindowDimensions()
  return useMemo(() => width < breakpoint, [width < breakpoint])
}

function Sidebar() {
  const isMobile = useIsMobile()
  return <View className={isMobile ? 'w-full' : 'w-64'} />
}
```

---

## 2. Use Functional setState Updates

**Impact: MEDIUM** — Prevents stale closures and unnecessary callback recreations.

When updating state based on the current state value, use the functional update form.

**Incorrect (requires state as dependency):**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  // Recreated on every items change
  const addItem = useCallback((newItem: Item) => {
    setItems([...items, newItem])
  }, [items])

  // Stale closure bug - missing items dependency
  const removeItem = useCallback((id: string) => {
    setItems(items.filter(item => item.id !== id))
  }, [])
}
```

**Correct (stable callbacks, no stale closures):**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  const addItem = useCallback((newItem: Item) => {
    setItems(curr => [...curr, newItem])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(curr => curr.filter(item => item.id !== id))
  }, [])
}
```

**When to use functional updates:**
- Any setState that depends on the current state value
- Inside useCallback when state is needed
- Async operations that update state

**When direct updates are fine:**
- Setting state to a static value: `setCount(0)`
- Setting state from props/arguments only: `setName(newName)`

---

## 3. Use Lazy State Initialization

**Impact: MEDIUM** — Avoids wasted computation on every render.

Pass a function to `useState` for expensive initial values. Without the function form, the initializer runs on every render even though the value is only used once.

**Incorrect (runs on every render):**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  const [searchIndex, setSearchIndex] = useState(buildSearchIndex(items))
}
```

**Correct (runs only once):**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(items))
}
```

Use lazy initialization when computing initial values from AsyncStorage, building data structures, or performing heavy transformations. For simple primitives (`useState(0)`) or cheap literals (`useState({})`), the function form is unnecessary.

---

## 4. Extract to Memoized Components

**Impact: MEDIUM** — Enables early returns before computation.

**Incorrect (computes avatar even when loading):**

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => computeAvatarId(user), [user])

  if (loading) return <ActivityIndicator />
  return <View><Avatar id={avatar} /></View>
}
```

**Correct (skips computation when loading):**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <ActivityIndicator />
  return <View><UserAvatar user={user} /></View>
}
```

### Extract Default Non-primitive Values

When a memoized component has a default non-primitive parameter, extract it to a constant.

**Incorrect (breaks memoization):**

```tsx
const UserAvatar = memo(function UserAvatar({ onPress = () => {} }) {
  // ...
})
```

**Correct (stable default value):**

```tsx
const NOOP = () => {}

const UserAvatar = memo(function UserAvatar({ onPress = NOOP }) {
  // ...
})
```

---

## 5. Narrow Effect Dependencies

**Impact: LOW** — Minimizes effect re-runs.

Specify primitive dependencies instead of objects.

**Incorrect (re-runs on any user field change):**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user])
```

**Correct (re-runs only when id changes):**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user.id])
```

---

## 6. Put Interaction Logic in Event Handlers

**Impact: MEDIUM** — Avoids effect re-runs and duplicate side effects.

If a side effect is triggered by a specific user action, run it in the event handler. Do not model actions as state + effect.

**Incorrect (event modeled as state + effect):**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) {
      post('/api/register')
    }
  }, [submitted])

  return <Pressable onPress={() => setSubmitted(true)}><AppText>Submit</AppText></Pressable>
}
```

**Correct (do it in the handler):**

```tsx
function Form() {
  function handleSubmit() {
    post('/api/register')
  }

  return <Pressable onPress={handleSubmit}><AppText>Submit</AppText></Pressable>
}
```

---

## 7. Don't Wrap Simple Expressions in useMemo

**Impact: LOW-MEDIUM** — The hook overhead exceeds the computation cost.

```tsx
// Incorrect
const isLoading = useMemo(() => {
  return user.isLoading || notifications.isLoading
}, [user.isLoading, notifications.isLoading])

// Correct
const isLoading = user.isLoading || notifications.isLoading
```

---

## 8. Use Transitions for Non-Urgent Updates

**Impact: MEDIUM** — Maintains UI responsiveness.

Mark frequent, non-urgent state updates as transitions.

```tsx
import { startTransition } from 'react'

// Non-blocking search filter update
const handleSearch = (text: string) => {
  setSearchText(text)  // urgent: update input
  startTransition(() => {
    setFilteredResults(filterItems(text))  // non-urgent: can be deferred
  })
}
```

---

## 9. Use useRef for Transient Values

**Impact: MEDIUM** — Avoids unnecessary re-renders on frequent updates.

When a value changes frequently and you don't need a re-render on every update, use `useRef` instead of `useState`.

**Incorrect (renders every update):**

```tsx
function Tracker() {
  const [lastY, setLastY] = useState(0)

  const onScroll = (event) => {
    setLastY(event.nativeEvent.contentOffset.y)
  }
}
```

**Correct (no re-render for tracking):**

```tsx
function Tracker() {
  const lastYRef = useRef(0)

  const onScroll = (event) => {
    lastYRef.current = event.nativeEvent.contentOffset.y
  }
}
```

---

## 10. Defer State Reads to Usage Point

**Impact: MEDIUM** — Avoids unnecessary subscriptions.

Don't subscribe to dynamic state if you only read it inside callbacks.

**Incorrect (subscribes to all route param changes):**

```tsx
function ShareButton({ itemId }: { itemId: string }) {
  const params = useLocalSearchParams()

  const handleShare = () => {
    const ref = params.ref
    shareItem(itemId, { ref })
  }

  return <Pressable onPress={handleShare}><AppText>Share</AppText></Pressable>
}
```

**Correct (reads on demand when possible):**

```tsx
function ShareButton({ itemId }: { itemId: string }) {
  const handleShare = () => {
    // Read navigation state only when needed, not on every render
    const ref = getRouteParam('ref')
    shareItem(itemId, { ref })
  }

  return <Pressable onPress={handleShare}><AppText>Share</AppText></Pressable>
}
```

---

## References

- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
