import AppText from "./AppText";
import { Pressable } from "react-native";
import { useUserStore } from "@/lib/stores/useUserStore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
};

export default function SaveButton({
  onPress,
  label = "Save",
}: SaveButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withSpring(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 200, damping: 15 });
    opacity.value = withSpring(1);
  };

  const isGuest = useUserStore((state) => state.preferences?.role === "guest");

  if (isGuest) {
    return (
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled>
        <Animated.View
          style={animatedStyle}
          className="bg-gray-400 py-2 rounded-md shadow-md border-2 border-gray-300"
        >
          <AppText className="text-gray-100 text-center text-lg">
            Save (not allowed)
          </AppText>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={animatedStyle}
        className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 "
      >
        <AppText className="text-gray-100 text-center text-lg">{label}</AppText>
      </Animated.View>
    </Pressable>
  );
}
