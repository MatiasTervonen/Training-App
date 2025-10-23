import { Link } from "expo-router";
import { Pressable } from "react-native";
import AppText from "./AppText";
import type { LinkProps } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface LinkButtonProps {
  href: LinkProps["href"];
  label?: string;
  children?: React.ReactNode;
}

export default function LinkButton({ href, label, children }: LinkButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shineX = useSharedValue(-200);
  const shineOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }],
    opacity: shineOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withSpring(0.8);

    // show light and animate it across
    shineOpacity.value = withTiming(1, { duration: 80 });
    shineX.value = -200;
    shineX.value = withTiming(400, { duration: 700 });
  };

  const handlePressOut = () => {
    // hide light and restore scale
    shineOpacity.value = withTiming(0, { duration: 150 });
    scale.value = withSpring(1, { stiffness: 200, damping: 15 });
    opacity.value = withSpring(1);
  };

  return (
    <Link href={href} asChild>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={animatedStyle}
          className="flex-row items-center justify-center gap-2 bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500 text-lg"
        >
          {/* Light sweep gradient */}
          <Animated.View
            style={[
              shineStyle,
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 80, // width of the light bar
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
          {label && <AppText className="text-lg">{label}</AppText>}
          {children}
        </Animated.View>
      </Pressable>
    </Link>
  );
}
