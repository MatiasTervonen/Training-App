import { ReactNode, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { CircleX } from "lucide-react-native";
import { View, Pressable, Dimensions } from "react-native";
import { Portal } from "react-native-paper";

export default function FullScreenModal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const translateX = useSharedValue(0);

  // Max width == max-w-3xl (768px) for the count of swipe dinstance to navigation

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  useEffect(() => {
    if (isOpen) {
      // reset modal position when reopened
      translateX.value = 0;
    }
  }, [isOpen, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onChange((event) => {
      translateX.value = event.translationX * 0.7;
    })
    .onFinalize(() => {
      const threshold = screenWidth * 0.2; // Minimum swipe distance to trigger close
      const exitDistance = screenWidth * 1.2; // Distance to move off-screen

      if (Math.abs(translateX.value) > threshold) {
        // If swipe distance exceeds threshold, close the modal
        translateX.value = withTiming(
          translateX.value > 0 ? exitDistance : -exitDistance,
          { duration: 300 },
          () => {
            runOnJS(onClose)();
          },
        );
      } else {
        // Otherwise, spring back to original position
        translateX.value = withSpring(0, {
          stiffness: 220,
          damping: 15,
          mass: 1,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!isOpen) return null;

  return (
    <Portal>
      <GestureDetector gesture={pan}>
        <View className="absolute inset-0 bg-black/50 flex-1 z-50 justify-end items-center">
          <Animated.View
            className="bg-slate-800 rounded-t-2xl h-[95%] w-full z-50 max-w-3xl"
            style={[animatedStyle]}
          >
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 z-[999]"
              hitSlop={10}
            >
              <CircleX size={30} color="#f3f4f6" />
            </Pressable>
            <View className="flex-1 max-w-xl px-2 w-full">{children}</View>
          </Animated.View>
        </View>
      </GestureDetector>
    </Portal>
  );
}
