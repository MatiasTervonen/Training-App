import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function Toggle({ isOn, onToggle, disabled }: ToggleProps) {
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

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }, [onToggle]);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onEnd(() => {
      runOnJS(handlePress)();
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={animatedStyleBg}
        className="rounded-full border-[1.5px] border-gray-300 w-[48px] h-[24px] p-0.5"
        hitSlop={10}
      >
        <Animated.View className="absolute left-0" style={animatedStyleKnot}>
          <View className="w-[20px] h-[20px] bg-slate-900 rounded-full" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
