import { useEffect } from "react";
import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
} from "react-native-reanimated";
import { ViewStyle } from "react-native";

export default function AnimatedBar({
  targetWidth,
  color,
  delay,
  height,
  style,
}: {
  targetWidth: number;
  color: string;
  delay?: number;
  height?: number;
  style?: ViewStyle;
}) {
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  useEffect(() => {
    width.value = withDelay(
      delay || 0,
      withTiming(targetWidth, { duration: 800 })
    );
  }, [targetWidth, delay, width]);

  return (
    <Animated.View
      style={[
        { backgroundColor: color, height: height || 20 },
        animatedStyle,
        style,
      ]}
    />
  );
}
