import { Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

export default function Toggle({ isOn, onToggle }: ToggleProps) {
  const translateX = useSharedValue(isOn ? 24 : 0);
  const bgColor = useSharedValue(isOn ? "#22c55e" : "#475569");

  useEffect(() => {
    translateX.value = withTiming(isOn ? 24 : 0, { duration: 200 });
    bgColor.value = withTiming(isOn ? "#22c55e" : "#475569", { duration: 200 });
  }, [isOn, translateX, bgColor]);

  const animatedStyleKnot = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedStyleBg = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  return (
    <Pressable onPress={onToggle} hitSlop={10}>
      <Animated.View
        style={animatedStyleBg}
        className={`rounded-full border-2 border-gray-300 w-[48px] h-[24px] transition-colors p-0.5 flex items-center   justify-center`}
        hitSlop={10}
      >
        <Animated.View className="absolute left-0" style={animatedStyleKnot}>
          <View className={`w-[20px] h-[20px] bg-slate-900 rounded-full`} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
