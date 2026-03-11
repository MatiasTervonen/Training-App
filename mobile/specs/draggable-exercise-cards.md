# Draggable Exercise Cards

## Context
During a gym session, users sometimes want to reorder exercises — e.g., move a later exercise up because a machine became free. Currently exercises are locked in the order they were added. This feature adds drag-to-reorder on the exercise cards in GymForm using a custom implementation built on `react-native-reanimated` (v4) and `react-native-gesture-handler` (v2.28) — no third-party drag-and-drop library.

## Requirements
- Long press on an exercise card activates drag mode
- Dragging an exercise over another swaps their positions
- Visual feedback: dragged card is slightly scaled up and has higher opacity/shadow
- Other cards animate smoothly to make room
- On release, card settles into its new position
- Works with both single exercises and superset groups (drag the whole group as one unit)
- Exercise order persists to the draft (already handled by existing draft save logic since it saves the `exercises` array)
- Only applies to GymForm (active session / edit), not TemplateForm

## Architecture

### What gets dragged
The draggable unit is the **superset group** (the LinearGradient card), not individual exercises within a superset. This matches the visual grouping — each card border is one draggable item. A single exercise is just a group of one.

### Component: `DraggableList`
A reusable wrapper component that handles all drag logic. Lives in `components/DraggableList.tsx`.

**Props:**
```typescript
type DraggableListProps<T> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
};
```

**Usage in GymForm:**
```tsx
<DraggableList
  items={Object.entries(groupedExercises)}
  onReorder={(reordered) => {
    // Flatten back to exercises array and update state
    const flat = reordered.flatMap(([_, group]) => group.map(g => g.exercise));
    setExercises(flat);
  }}
  keyExtractor={([supersetId]) => supersetId}
  renderItem={([supersetId, group], index) => (
    <LinearGradient ...>
      {group.map(({ exercise, index }) => (
        <ExerciseCard ... />
      ))}
    </LinearGradient>
  )}
/>
```

### How the drag works

#### Gesture handling
- Use `Gesture.Pan()` from `react-native-gesture-handler` combined with a long press activation
- `Gesture.LongPress()` triggers drag activation (300ms threshold)
- `Gesture.Simultaneous()` or `Gesture.Race()` to combine long press + pan

#### Layout measurement
- On mount and when items change, measure each item's Y offset and height using `onLayout`
- Store measurements in a shared value: `useSharedValue<{ y: number; height: number }[]>([])`

#### During drag
1. Long press fires → set `activeIndex` shared value
2. Card gets scale(1.03) transform and elevated shadow via `useAnimatedStyle`
3. Pan gesture updates `translateY` shared value
4. On each frame, check if the dragged item's midpoint has crossed another item's midpoint
5. When crossing detected → swap items in the order array using `runOnJS` callback
6. Non-dragged items animate to their new positions with `withTiming()`

#### On release
1. Animate dragged card to its final position with `withTiming()`
2. Reset `activeIndex` to -1
3. Call `onReorder` with the new order

### Scroll handling
The exercise list is inside a `KeyboardAwareScrollView`. During drag:
- Disable scroll on the parent ScrollView (`scrollEnabled={false}`) while dragging
- If the dragged item is near the top/bottom edge (within 80px), auto-scroll the parent
- Use `scrollTo()` with a recurring `requestAnimationFrame` loop for smooth auto-scroll

## Implementation Steps

### Step 1: Build `DraggableList` component
- Create `components/DraggableList.tsx`
- Implement `GestureDetector` with long press + pan
- Measure item layouts
- Handle reorder logic with animated shared values
- Add visual feedback (scale, shadow) on active item

### Step 2: Integrate into GymForm
- Replace the current `Object.entries(groupedExercises).map(...)` with `DraggableList`
- Pass `scrollEnabled` state to `KeyboardAwareScrollView` to disable scroll during drag
- Flatten reordered groups back into the exercises array on reorder
- Make sure collapsed/expanded state follows the exercises (use exercise_id based tracking instead of index)

### Step 3: Handle edge cases
- Superset groups with multiple exercises drag as one unit
- Collapsing/expanding cards recalculates layout measurements
- Adding/removing exercises recalculates measurements
- Draft auto-save picks up the new order automatically

## Visual Design

### Idle state
Cards look exactly as they do now.

### Drag active
- Long-pressed card: `scale(1.03)`, slightly brighter border, subtle shadow
- Gap opens where the card will land
- Other cards slide up/down smoothly (200ms timing)

### Drop
- Card animates to final position (200ms)
- All cards settle

## Files to Create/Modify
- **Create**: `components/DraggableList.tsx` — reusable drag-and-drop list
- **Modify**: `features/gym/components/GymForm.tsx` — use DraggableList for exercise groups
- **Modify**: `features/gym/components/GymForm.tsx` — switch collapsed tracking from index to exercise_id based

## Dependencies
- `react-native-reanimated` v4.1.5 (already installed)
- `react-native-gesture-handler` v2.28 (already installed)
- No new packages needed
