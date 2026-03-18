import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DISMISS_THRESHOLD = 150;

export default function useSwipeToDismiss(onClose: () => void) {
  const dismissY = useSharedValue(0);
  const bgOpacity = useSharedValue(1);

  const reset = () => {
    dismissY.value = 0;
    bgOpacity.value = 1;
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      dismissY.value = e.translationY;
      bgOpacity.value = Math.max(
        0.3,
        1 - Math.abs(e.translationY) / (SCREEN_HEIGHT * 0.4),
      );
    })
    .onEnd(() => {
      if (Math.abs(dismissY.value) > DISMISS_THRESHOLD) {
        bgOpacity.value = withTiming(0, { duration: 200 });
        dismissY.value = withTiming(
          dismissY.value > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
          { duration: 200 },
          () => {
            scheduleOnRN(onClose);
          },
        );
      } else {
        dismissY.value = withTiming(0);
        bgOpacity.value = withTiming(1);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return { panGesture, contentStyle, bgStyle, reset };
}
