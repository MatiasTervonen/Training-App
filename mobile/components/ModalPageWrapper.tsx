import { View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SquareArrowLeft,
  SquareArrowRight,
  SquareArrowUp,
} from "lucide-react-native";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTransitionDirectionStore } from "@/lib/stores/transitionDirection";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import { scheduleOnRN } from "react-native-worklets";
import BodyTextNC from "./BodyTextNC";

// Context for pages with ScrollViews to report their scroll position
const ModalScrollYContext = createContext<SharedValue<number> | null>(null);

export function useModalPageScroll() {
  const scrollY = useContext(ModalScrollYContext);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });

  return handleScroll;
}

type Props = {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  topLabel?: string;
};

export default function ModalPageWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  leftLabel,
  rightLabel,
  topLabel,
}: Props) {
  const { t } = useTranslation("common");
  const [isReady, setIsReady] = useState(false);

  const resolvedLeftLabel = leftLabel ?? t("navigation.back");
  const resolvedRightLabel = rightLabel ?? t("navigation.home");

  const router = useRouter();
  const direction = useTransitionDirectionStore((state) => state.direction);
  const setDirection = useTransitionDirectionStore(
    (state) => state.setDirection,
  );

  const modalPageConfig = useModalPageConfig((state) => state.modalPageConfig);

  const swipeEnabled = modalPageConfig?.swipeEnabled ?? true;

  // Max width == max-w-3xl (768px) for the count of swipe dinstance to navigation

  const { width: rawScreenWidth, height: screenHeight } = Dimensions.get("window");
  const screenWidth = Math.min(rawScreenWidth, 768);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const entryTranslateX = useSharedValue(0);
  const fadeOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

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
      scheduleOnRN(setIsReady, true); // mark as ready
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

  const handleSwipeDown = () => {
    if (onSwipeDown) {
      onSwipeDown();
    }
  };

  const dragThreshold = screenWidth * 0.3;
  const dragThresholdY = 120;
  const velocityThreshold = 700;

  const swipeProgress = useSharedValue(0);
  const swipeDownProgress = useSharedValue(0);
  // Horizontal pan — activates on horizontal movement, fails on vertical
  const horizontalPan = Gesture.Pan()
    .enabled(swipeEnabled)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.4;
      swipeProgress.value = Math.max(
        -1,
        Math.min(1, e.translationX / dragThreshold),
      );
    })
    .onEnd((event) => {
      const swipedRight =
        event.velocityX > velocityThreshold ||
        event.translationX > dragThreshold;
      const swipedLeft =
        event.velocityX < -velocityThreshold ||
        event.translationX < -dragThreshold;

      swipeProgress.value = withTiming(0, { duration: 200 });

      if (swipedRight) {
        translateX.value = withTiming(screenWidth, { duration: 250 });
        fadeOpacity.value = withTiming(0, { duration: 250 });
        scheduleOnRN(handleSwipeRight);
      } else if (swipedLeft) {
        translateX.value = withTiming(-screenWidth, { duration: 250 });
        fadeOpacity.value = withTiming(0, { duration: 250 });
        scheduleOnRN(handleSwipeLeft);
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 0.5,
        });
      }
    });

  // Vertical pan — manual activation to avoid stealing from ScrollView
  const touchStartY = useSharedValue(0);
  const touchStartX = useSharedValue(0);
  const verticalActivated = useSharedValue(false);

  const verticalPan = Gesture.Pan()
    .enabled(swipeEnabled && !!onSwipeDown)
    .manualActivation(true)
    .onTouchesDown((event) => {
      if (event.numberOfTouches === 1) {
        touchStartX.value = event.allTouches[0].absoluteX;
        touchStartY.value = event.allTouches[0].absoluteY;
        verticalActivated.value = false;
      }
    })
    .onTouchesMove((event, stateManager) => {
      // Once activated, stop processing — let onUpdate/onEnd handle it
      if (verticalActivated.value) return;

      if (event.numberOfTouches !== 1) {
        stateManager.fail();
        return;
      }

      const dx = event.allTouches[0].absoluteX - touchStartX.value;
      const dy = event.allTouches[0].absoluteY - touchStartY.value;

      // Fail if horizontal movement is dominant
      if (Math.abs(dx) > 15) {
        stateManager.fail();
        return;
      }

      // Activate if pulling down while at scroll top
      if (dy > 15 && scrollY.value <= 2) {
        verticalActivated.value = true;
        stateManager.activate();
        return;
      }

      // Fail if swiping up
      if (dy < -15) {
        stateManager.fail();
      }
    })
    .onUpdate((e) => {
      const clamped = Math.max(0, e.translationY);
      translateY.value = clamped * 0.4;
      swipeDownProgress.value = Math.min(1, clamped / dragThresholdY);
    })
    .onEnd((event) => {
      // Distance-only trigger — no velocity shortcut so it requires a deliberate pull
      const swipedDown = event.translationY > dragThresholdY;

      swipeDownProgress.value = withTiming(0, { duration: 200 });

      if (swipedDown) {
        translateY.value = withTiming(screenHeight, { duration: 250 });
        fadeOpacity.value = withTiming(0, { duration: 250 });
        scheduleOnRN(handleSwipeDown);
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 0.5,
        });
      }
    });

  const gesture = Gesture.Race(horizontalPan, verticalPan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: entryTranslateX.value + translateX.value },
      { translateY: translateY.value },
    ],
    opacity: fadeOpacity.value,
  }));

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, swipeProgress.value),
    width: Math.max(0, translateX.value),
  }));

  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, -swipeProgress.value),
    width: Math.max(0, -translateX.value),
  }));

  const topLabelStyle = useAnimatedStyle(() => ({
    opacity: swipeDownProgress.value,
    height: translateY.value,
  }));

  return (
    <ModalScrollYContext.Provider value={scrollY}>
      <View className="flex-1 overflow-hidden">
        <View
          className="absolute inset-0 bg-slate-900"
          pointerEvents="none"
        >
          <Animated.View
            className="absolute left-0 top-0 bottom-0 items-center pt-[10px] overflow-hidden"
            style={leftLabelStyle}
          >
            {resolvedLeftLabel && (
              <View className="items-center gap-2">
                <View>
                  {resolvedLeftLabel
                    .toUpperCase()
                    .split("")
                    .map((letter, index) => (
                      <BodyTextNC className="text-center text-gray-400" key={index}>
                        {letter}
                      </BodyTextNC>
                    ))}
                </View>
                <SquareArrowLeft size={24} color={"#9ca3af"} />
              </View>
            )}
          </Animated.View>

          <Animated.View
            className="absolute right-0 top-0 bottom-0 items-center pt-[10px] overflow-hidden"
            style={rightLabelStyle}
          >
            {resolvedRightLabel && (
              <View className="items-center gap-2">
                <View>
                  {resolvedRightLabel
                    .toUpperCase()
                    .split("")
                    .map((letter, index) => (
                      <BodyTextNC className="text-center text-gray-400" key={index}>
                        {letter}
                      </BodyTextNC>
                    ))}
                </View>
                <SquareArrowRight size={24} color={"#9ca3af"} />
              </View>
            )}
          </Animated.View>
        </View>

        {topLabel && (
          <Animated.View
            className="absolute top-0 left-0 right-0 items-center justify-center"
            style={topLabelStyle}
            pointerEvents="none"
          >
            <SquareArrowUp size={28} color={"#9ca3af"} />
            <BodyTextNC className="text-gray-400 text-base mt-1">
              {topLabel.toUpperCase()}
            </BodyTextNC>
          </Animated.View>
        )}

        <GestureDetector gesture={isReady ? gesture : Gesture.Tap()}>
          <Animated.View className="flex-1" style={[animatedStyle]}>
            <LinearGradient
              className="flex-1"
              colors={["#020618", "#1d293d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {children}
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </View>
    </ModalScrollYContext.Provider>
  );
}
