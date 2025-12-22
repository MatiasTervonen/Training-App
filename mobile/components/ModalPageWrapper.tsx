import AppText from "./AppText";
import { View, Dimensions } from "react-native";
import { SquareArrowLeft, SquareArrowRight } from "lucide-react-native";
import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTransitionDirectionStore } from "@/lib/stores/transitionDirection";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";

type Props = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  initialTranslateX?: number;
};

export default function ModalPageWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "back",
  rightLabel = "home",
}: Props) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const router = useRouter();
  const direction = useTransitionDirectionStore((state) => state.direction);
  const setDirection = useTransitionDirectionStore(
    (state) => state.setDirection
  );

  const modalPageConfig = useModalPageConfig((state) => state.modalPageConfig);

  const swipeEnabled = modalPageConfig?.swipeEnabled ?? true;

  // Max width == max-w-3xl (768px) for the count of swipe dinstance to navigation

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  const translateX = useSharedValue(0);
  const entryTranslateX = useSharedValue(0);
  const fadeOpacity = useSharedValue(0);

  // Slide-in animation on mount
  useEffect(() => {
    entryTranslateX.value = direction * screenWidth;
    fadeOpacity.value = 0;

    requestAnimationFrame(() => {
      entryTranslateX.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 0.5,
      });
      fadeOpacity.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
      runOnJS(setIsReady)(true); // mark as ready
      setDirection(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipeLeft = () => {
    setDirection(1);
    if (onSwipeLeft) {
      onSwipeLeft();
    } else {
      router.push("/dashboard");
    }
  };

  const handleSwipeRight = () => {
    setDirection(-1);
    if (onSwipeRight) {
      onSwipeRight();
    } else {
      router.back();
    }
  };

  const dragThreshold = screenWidth * 0.4;
  const velocityThreshold = 700;

  const pan = Gesture.Pan()
    .enabled(swipeEnabled ?? true)
    // Restrict gesture to horizontal swipes only
    .activeOffsetX([-30, 30]) // Activate only if horizontal movement exceeds 30 pixels
    .activeOffsetY([-1000, 1000]) // Prevent activation for vertical movements
    .onStart(() => {
      runOnJS(setIsTransitioning)(true);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.2; // follow finger a bit
    })
    .onEnd((event) => {
      const swipedRight =
        event.velocityX > velocityThreshold ||
        event.translationX > dragThreshold;
      const swipedLeft =
        event.velocityX < -velocityThreshold ||
        event.translationX < -dragThreshold;

      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.5,
      });

      if (swipedRight) {
        runOnJS(handleSwipeRight)();
      } else if (swipedLeft) {
        runOnJS(handleSwipeLeft)();
      }

      runOnJS(setIsTransitioning)(false);
    });

  const tap = Gesture.Tap();

  // Allow simultaneous gestures for scrolling and horizontal swipes
  const swipeGesture = Gesture.Simultaneous(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: entryTranslateX.value + translateX.value }],
    opacity: fadeOpacity.value,
  }));

  return (
    <View className="flex-1">
      <View className="flex-1 absolute inset-0 flex-row justify-between bg-slate-900 pt-[10px]">
        <View className="flex-col items-center gap-2 ml-2">
          {isTransitioning && leftLabel && (
            <>
              <View>
                {leftLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <AppText className="text-center text-xl" key={index}>
                      {letter}
                    </AppText>
                  ))}
              </View>
              <SquareArrowLeft size={35} color={"#f3f4f6"} />
            </>
          )}
        </View>

        <View className="flex-col items-center gap-2 mr-2">
          {isTransitioning && rightLabel && (
            <>
              <View>
                {rightLabel
                  ?.toUpperCase()
                  .split("")
                  .map((letter, index) => (
                    <AppText className="text-center text-xl" key={index}>
                      {letter}
                    </AppText>
                  ))}
              </View>
              <SquareArrowRight size={35} color={"#f3f4f6"} />
            </>
          )}
        </View>
      </View>
      <GestureDetector gesture={isReady ? swipeGesture : Gesture.Tap()}>
        <Animated.View className="flex-1 bg-slate-800" style={[animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
