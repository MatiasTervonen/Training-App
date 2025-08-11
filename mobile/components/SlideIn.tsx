import { useEffect, ReactNode } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTransitionDirectionStore } from "@/lib/stores/transitionDirection";

export default function SlideIn({ children }: { children: ReactNode }) {
  const { direction, setDirection } = useTransitionDirectionStore();
  const translateX = useSharedValue(direction * 300);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 300 });
    setDirection(0);
  }, [direction, setDirection, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
