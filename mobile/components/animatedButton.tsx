import { Pressable, PressableProps } from "react-native";
import AppText from "./AppText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface AppButtonProps extends PressableProps {
  label?: string;
  children?: React.ReactNode;
  onPress: () => void;
  className?: string;
  textClassName?: string;
}

export default function AnimatedButton({
  label,
  children,
  onPress,
  className,
  textClassName,
  ...props
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
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`${className}`}
        {...props}
      >
        {label && (
          <AppText className={`text-lg ${textClassName}`}>{label}</AppText>
        )}
        {children}
      </Pressable>
    </Animated.View>
  );
}
