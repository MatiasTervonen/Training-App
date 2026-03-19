import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import AppText from "@/components/AppText";

interface MilestoneToastData {
  lines: string[];
}

interface Props {
  toast: MilestoneToastData | null;
}

export default function MilestoneToast({ toast }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(2800, withTiming(0, { duration: 500 })),
      );
    }
  }, [toast, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={animatedStyle}
      className="absolute top-12 left-0 right-0 z-50 items-center"
    >
      <View className="bg-black/80 rounded-xl px-6 py-3">
        {toast.lines.map((line, i) => (
          <AppText key={i} className="text-white text-lg text-center">
            {line}
          </AppText>
        ))}
      </View>
    </Animated.View>
  );
}
