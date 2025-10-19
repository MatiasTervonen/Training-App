import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

type AppButtonProps = {
  label: string;
  className?: string;
  onPress?: () => void; // Optional onPress for additional functionality
};

export default function GradientButton({
  label,
  className,
  onPress,
}: AppButtonProps) {
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

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={["#020618", "#1447e6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`rounded-md overflow-hidden ${className}`}
      >
        <Pressable
          className="py-2 border-2 border-blue-700 rounded-md"
          onPress={onPress}
          android_ripple={{ color: "#666" }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <AppText className="text-center text-xl">{label}</AppText>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}
