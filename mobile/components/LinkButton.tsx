import { Link } from "expo-router";
import { Pressable } from "react-native";
import AppText from "./AppText";
import type { LinkProps } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface LinkButtonProps {
  href: LinkProps["href"];
  label?: string;
  children?: React.ReactNode;
}

export default function LinkButton({ href, label, children }: LinkButtonProps) {
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
    <Link href={href} asChild>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={animatedStyle}
          className="flex-row items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg"
        >
          {label && <AppText className="text-lg">{label}</AppText>}
          {children}
        </Animated.View>
      </Pressable>
    </Link>
  );
}
