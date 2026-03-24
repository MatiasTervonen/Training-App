import {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { View, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

type ItemLayout = { y: number; height: number };

type DraggableListProps<T> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

function DraggableItem({
  children,
  originalIndex,
  activeIndex,
  currentSlot,
  dragTranslateY,
  dragHeight,
  layoutsRef,
  onActivate,
  onComputeSlot,
  onDrop,
  onCancel,
}: {
  children: ReactNode;
  originalIndex: number;
  activeIndex: SharedValue<number>;
  currentSlot: SharedValue<number>;
  dragTranslateY: SharedValue<number>;
  dragHeight: SharedValue<number>;
  layoutsRef: React.MutableRefObject<ItemLayout[]>;
  onActivate: (dragIdx: number) => void;
  onComputeSlot: (dragIdx: number, translationY: number) => void;
  onDrop: (draggedIndex: number, targetSlot: number) => void;
  onCancel: () => void;
}) {
  const indexSV = useSharedValue(originalIndex);
  indexSV.value = originalIndex;

  const gestureActive = useSharedValue(false);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      layoutsRef.current[originalIndex] = { y, height };
    },
    [originalIndex, layoutsRef],
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(300)
    .failOffsetX([-10, 10])
    .onStart(() => {
      if (activeIndex.value !== -1) return;
      gestureActive.value = true;
      const idx = indexSV.value;
      activeIndex.value = idx;
      currentSlot.value = idx;
      dragTranslateY.value = 0;
      scheduleOnRN(onActivate, idx);
    })
    .onUpdate((e) => {
      if (!gestureActive.value) return;
      dragTranslateY.value = e.translationY;
      scheduleOnRN(onComputeSlot, activeIndex.value, e.translationY);
    })
    .onEnd(() => {
      if (!gestureActive.value) return;
      gestureActive.value = false;
      const slot = currentSlot.value;
      const idx = indexSV.value;

      if (slot === idx) {
        dragTranslateY.value = withTiming(0, { duration: 200 }, () => {
          activeIndex.value = -1;
          currentSlot.value = -1;
          dragHeight.value = 0;
          scheduleOnRN(onCancel);
        });
        return;
      }

      scheduleOnRN(onDrop, idx, slot);
    })
    .onFinalize(() => {
      if (gestureActive.value) {
        gestureActive.value = false;
        activeIndex.value = -1;
        currentSlot.value = -1;
        dragTranslateY.value = 0;
        scheduleOnRN(onCancel);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const myIndex = indexSV.value;
    const dragIdx = activeIndex.value;
    const slot = currentSlot.value;
    const transY = dragTranslateY.value;
    const dHeight = dragHeight.value;

    if (dragIdx === myIndex && dragIdx !== -1) {
      return {
        transform: [
          { scale: withTiming(1.03, { duration: 150 }) },
          { translateY: transY },
        ],
        opacity: withTiming(0.85, { duration: 150 }),
        zIndex: 999,
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      };
    }

    if (dragIdx === -1) {
      return {
        transform: [
          { scale: withTiming(1, { duration: 150 }) },
          { translateY: 0 },
        ],
        opacity: withTiming(1, { duration: 150 }),
        zIndex: 1,
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };
    }

    let shift = 0;
    if (slot !== -1 && dHeight > 0) {
      if (dragIdx < slot) {
        if (myIndex > dragIdx && myIndex <= slot) {
          shift = -dHeight;
        }
      } else if (dragIdx > slot) {
        if (myIndex >= slot && myIndex < dragIdx) {
          shift = dHeight;
        }
      }
    }

    return {
      transform: [
        { scale: withTiming(1, { duration: 150 }) },
        { translateY: withTiming(shift, { duration: 200 }) },
      ],
      opacity: withTiming(1, { duration: 150 }),
      zIndex: 1,
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View onLayout={handleLayout} style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export default function DraggableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  onDragStart,
  onDragEnd,
}: DraggableListProps<T>) {
  const [renderItems, setRenderItems] = useState(items);

  const prevItemsRef = useRef(items);
  if (items !== prevItemsRef.current) {
    prevItemsRef.current = items;
    setRenderItems(items);
  }

  const activeIndex = useSharedValue(-1);
  const currentSlot = useSharedValue(-1);
  const dragTranslateY = useSharedValue(0);
  const dragHeight = useSharedValue(0);
  const layoutsRef = useRef<ItemLayout[]>([]);
  const renderItemsRef = useRef(renderItems);
  renderItemsRef.current = renderItems;

  // ✅ FIX: flag to reset shared values AFTER react re-renders new order
  const pendingReset = useRef(false);

  useLayoutEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      activeIndex.value = -1;
      currentSlot.value = -1;
      dragTranslateY.value = 0;
      dragHeight.value = 0;
    }
  });

  const handleActivate = useCallback(
    (dragIdx: number) => {
      const layout = layoutsRef.current[dragIdx];
      dragHeight.value = layout ? layout.height : 0;
      onDragStart?.();
    },
    [dragHeight, onDragStart],
  );

  const computeSlot = useCallback(
    (dragIdx: number, translationY: number) => {
      const allLayouts = layoutsRef.current;
      const dragLayout = allLayouts[dragIdx];
      if (!dragLayout) return;

      const draggedMidY = dragLayout.y + dragLayout.height / 2 + translationY;

      let slot = dragIdx;
      for (let i = 0; i < allLayouts.length; i++) {
        if (i === dragIdx || !allLayouts[i]) continue;
        const otherMid = allLayouts[i].y + allLayouts[i].height / 2;
        const threshold = allLayouts[i].height * 0.2;
        if (dragIdx < i && draggedMidY > otherMid - threshold) {
          slot = Math.max(slot, i);
        } else if (dragIdx > i && draggedMidY < otherMid + threshold) {
          slot = Math.min(slot, i);
        }
      }
      currentSlot.value = slot;
    },
    [currentSlot],
  );

  const commitReorder = useCallback(
    (draggedIndex: number, targetSlot: number) => {
      const current = renderItemsRef.current;
      const newItems = [...current];
      const [moved] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetSlot, 0, moved);

      setRenderItems(newItems);
      renderItemsRef.current = newItems;

      // ✅ FIX: flag the reset instead of resetting immediately
      pendingReset.current = true;

      onReorder(newItems);
      onDragEnd?.();
    },
    [onReorder, onDragEnd],
  );

  const handleDrop = useCallback(
    (draggedIndex: number, targetSlot: number) => {
      if (draggedIndex !== targetSlot) {
        const layouts = layoutsRef.current;
        let targetY = 0;

        if (draggedIndex < targetSlot) {
          for (let i = draggedIndex + 1; i <= targetSlot; i++) {
            if (layouts[i]) targetY += layouts[i].height;
          }
        } else {
          for (let i = targetSlot; i < draggedIndex; i++) {
            if (layouts[i]) targetY -= layouts[i].height;
          }
        }

        dragTranslateY.value = withTiming(
          targetY,
          { duration: 200 },
          (finished) => {
            if (finished) {
              scheduleOnRN(commitReorder, draggedIndex, targetSlot);
            }
          },
        );
      } else {
        onDragEnd?.();
      }
    },
    [dragTranslateY, commitReorder, onDragEnd],
  );

  const handleCancel = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <View>
      {renderItems.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
          <DraggableItem
            key={key}
            originalIndex={index}
            activeIndex={activeIndex}
            currentSlot={currentSlot}
            dragTranslateY={dragTranslateY}
            dragHeight={dragHeight}
            layoutsRef={layoutsRef}
            onActivate={handleActivate}
            onComputeSlot={computeSlot}
            onDrop={handleDrop}
            onCancel={handleCancel}
          >
            {renderItem(item, index)}
          </DraggableItem>
        );
      })}
    </View>
  );
}
