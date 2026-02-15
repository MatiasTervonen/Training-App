---
title: JavaScript Performance Patterns
impact: MEDIUM
tags: javascript, performance, caching, data-structures, loops, optimization
---

# JavaScript Performance Patterns

## 1. Use Set/Map for O(1) Lookups

**Impact: LOW-MEDIUM** — O(n) to O(1) per check.

Convert arrays to Set/Map for repeated membership checks.

**Incorrect (O(n) per check):**

```typescript
const allowedIds = ['a', 'b', 'c']
items.filter(item => allowedIds.includes(item.id))
```

**Correct (O(1) per check):**

```typescript
const allowedIds = new Set(['a', 'b', 'c'])
items.filter(item => allowedIds.has(item.id))
```

---

## 2. Build Index Maps for Repeated Lookups

**Impact: LOW-MEDIUM** — 1M ops to 2K ops.

Multiple `.find()` calls by the same key should use a Map.

**Incorrect (O(n) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)
  }))
}
```

**Correct (O(1) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map(u => [u.id, u]))

  return orders.map(order => ({
    ...order,
    user: userById.get(order.userId)
  }))
}
```

---

## 3. Cache Repeated Function Calls

**Impact: MEDIUM** — Avoids redundant computation.

Use a module-level Map to cache function results when the same function is called repeatedly with the same inputs.

**Incorrect:**

```typescript
function ItemList({ items }: { items: Item[] }) {
  return (
    <View>
      {items.map(item => {
        const slug = slugify(item.name) // called 100+ times for same names
        return <ItemCard key={item.id} slug={slug} />
      })}
    </View>
  )
}
```

**Correct:**

```typescript
const slugifyCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugifyCache.has(text)) return slugifyCache.get(text)!
  const result = slugify(text)
  slugifyCache.set(text, result)
  return result
}
```

Use a Map (not a hook) so it works everywhere: utilities, event handlers, not just React components.

---

## 4. Combine Multiple Array Iterations

**Impact: LOW-MEDIUM** — Reduces iterations.

Multiple `.filter()` or `.map()` calls iterate the array multiple times. Combine into one loop.

**Incorrect (3 iterations):**

```typescript
const admins = users.filter(u => u.isAdmin)
const testers = users.filter(u => u.isTester)
const inactive = users.filter(u => !u.isActive)
```

**Correct (1 iteration):**

```typescript
const admins: User[] = []
const testers: User[] = []
const inactive: User[] = []

for (const user of users) {
  if (user.isAdmin) admins.push(user)
  if (user.isTester) testers.push(user)
  if (!user.isActive) inactive.push(user)
}
```

---

## 5. Early Return from Functions

**Impact: LOW-MEDIUM** — Avoids unnecessary computation.

Return early when result is determined to skip unnecessary processing.

**Incorrect:**

```typescript
function validateUsers(users: User[]) {
  let hasError = false
  let errorMessage = ''

  for (const user of users) {
    if (!user.email) { hasError = true; errorMessage = 'Email required' }
    if (!user.name) { hasError = true; errorMessage = 'Name required' }
  }

  return hasError ? { valid: false, error: errorMessage } : { valid: true }
}
```

**Correct:**

```typescript
function validateUsers(users: User[]) {
  for (const user of users) {
    if (!user.email) return { valid: false, error: 'Email required' }
    if (!user.name) return { valid: false, error: 'Name required' }
  }
  return { valid: true }
}
```

---

## 6. Cache Property Access in Loops

**Impact: LOW-MEDIUM** — Reduces lookups in hot paths.

```typescript
// Incorrect (3 lookups x N iterations)
for (let i = 0; i < arr.length; i++) {
  process(obj.config.settings.value)
}

// Correct (1 lookup total)
const value = obj.config.settings.value
const len = arr.length
for (let i = 0; i < len; i++) {
  process(value)
}
```

---

## 7. Cache AsyncStorage Reads

**Impact: LOW-MEDIUM** — Reduces expensive async I/O.

AsyncStorage reads are async and slow. Cache reads in memory.

**Incorrect (reads storage every call):**

```typescript
async function getTheme() {
  return (await AsyncStorage.getItem('theme')) ?? 'light'
}
```

**Correct (in-memory cache):**

```typescript
const storageCache = new Map<string, string | null>()

async function getCachedStorage(key: string) {
  if (storageCache.has(key)) return storageCache.get(key)
  const value = await AsyncStorage.getItem(key)
  storageCache.set(key, value)
  return value
}

async function setCachedStorage(key: string, value: string) {
  await AsyncStorage.setItem(key, value)
  storageCache.set(key, value)
}
```

---

## 8. Hoist RegExp Creation

**Impact: LOW-MEDIUM** — Avoids recreation on every render.

Don't create RegExp inside render. Hoist to module scope or memoize.

**Incorrect (new RegExp every render):**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**Correct:**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = useMemo(
    () => new RegExp(`(${escapeRegex(query)})`, 'gi'),
    [query]
  )
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

---

## 9. Early Length Check for Array Comparisons

**Impact: MEDIUM-HIGH** — Avoids expensive operations when lengths differ.

```typescript
function hasChanges(current: string[], original: string[]) {
  if (current.length !== original.length) return true

  const currentSorted = current.toSorted()
  const originalSorted = original.toSorted()
  for (let i = 0; i < currentSorted.length; i++) {
    if (currentSorted[i] !== originalSorted[i]) return true
  }
  return false
}
```

---

## 10. Use Loop for Min/Max Instead of Sort

**Impact: LOW** — O(n) instead of O(n log n).

```typescript
// Incorrect — sorts entire array for one value
const latest = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0]

// Correct — single pass
function getLatest(projects: Project[]) {
  if (projects.length === 0) return null
  let latest = projects[0]
  for (let i = 1; i < projects.length; i++) {
    if (projects[i].updatedAt > latest.updatedAt) latest = projects[i]
  }
  return latest
}
```

---

## 11. Use toSorted() for Immutable Sorting

**Impact: MEDIUM-HIGH** — Prevents mutation bugs in React state.

`.sort()` mutates the array in place. Use `.toSorted()` in React to avoid mutating state/props.

```typescript
// Incorrect — mutates the users prop
const sorted = users.sort((a, b) => a.name.localeCompare(b.name))

// Correct — creates new array
const sorted = users.toSorted((a, b) => a.name.localeCompare(b.name))

// Fallback for older Hermes versions
const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name))
```

Also available: `.toReversed()`, `.toSpliced()`, `.with()`.
