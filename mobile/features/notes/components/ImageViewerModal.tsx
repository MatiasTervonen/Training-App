import { View, Modal, Image, FlatList, Dimensions } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useCallback, useRef, useState } from "react";

type ImageItem = {
  id: string;
  uri: string;
};

type Props = {
  images: ImageItem[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");
const DISMISS_THRESHOLD = 150;

function ImagePage({
  uri,
  onClose,
  onZoomChange,
}: {
  uri: string;
  onClose: () => void;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const bgOpacity = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(onZoomChange)(false);
      } else {
        savedScale.value = scale.value;
        runOnJS(onZoomChange)(scale.value > 1);
      }
    });

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      if (e.numberOfTouches === 1) {
        startX.value = e.allTouches[0].absoluteX;
        startY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e, state) => {
      if (savedScale.value > 1) {
        // Zoomed — activate immediately for free panning
        state.activate();
      } else if (e.numberOfTouches === 1) {
        // Not zoomed — replicate activeOffsetY/failOffsetX behavior
        const dx = Math.abs(e.allTouches[0].absoluteX - startX.value);
        const dy = Math.abs(e.allTouches[0].absoluteY - startY.value);
        if (dy > 10) {
          // Vertical first → activate for dismiss
          state.activate();
        } else if (dx > 10) {
          // Horizontal first → fail so FlatList handles swipe-to-change
          state.fail();
        }
      }
    })
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        dismissY.value = e.translationY;
        bgOpacity.value = Math.max(
          0.3,
          1 - Math.abs(e.translationY) / (SCREEN_HEIGHT * 0.4),
        );
      }
    })
    .onEnd(() => {
      if (savedScale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        if (Math.abs(dismissY.value) > DISMISS_THRESHOLD) {
          bgOpacity.value = withTiming(0, { duration: 200 });
          dismissY.value = withTiming(
            dismissY.value > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
            { duration: 200 },
            () => {
              runOnJS(onClose)();
            },
          );
        } else {
          dismissY.value = withTiming(0);
          bgOpacity.value = withTiming(1);
        }
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(onZoomChange)(false);
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
        runOnJS(onZoomChange)(true);
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <Animated.View
        className="absolute inset-0 bg-black/95"
        style={bgStyle}
      />
      <GestureDetector gesture={composed}>
        <Animated.View
          className="flex-1 justify-center items-center"
          style={imageStyle}
        >
          <Image
            source={{ uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ImageViewerModal({
  images,
  initialIndex,
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ImageItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-black">
          <View
            className="absolute right-4 z-10 flex-row items-center gap-3"
            style={{ top: insets.top + 8 }}
          >
            {images.length > 1 && (
              <View className="bg-slate-800/80 border border-slate-600 rounded-full px-3 py-1">
                <AppText className="text-sm">
                  {currentIndex + 1} / {images.length}
                </AppText>
              </View>
            )}
            <AnimatedButton
              onPress={onClose}
              className="bg-slate-800 border-slate-600 border-2 rounded-full p-2"
            >
              <X color="white" size={24} />
            </AnimatedButton>
          </View>

          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <ImagePage
                uri={item.uri}
                onClose={onClose}
                onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
              />
            )}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
