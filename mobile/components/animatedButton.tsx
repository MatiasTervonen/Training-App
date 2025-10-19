import { Pressable } from "react-native";
import AppText from "./AppText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";


interface AppButtonProps {
  label?: string;
  children?: React.ReactNode;
  onPress: () => void;
}

export default function AnimatedButton({
  label,
  children,
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
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={animatedStyle}
      >
        {label && <AppText className="text-lg">{label}</AppText>}
        {children}
      </Animated.View>
    </Pressable>
  );
}
