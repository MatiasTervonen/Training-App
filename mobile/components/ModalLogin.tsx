import { ReactNode, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { CircleX } from "lucide-react-native";
import {
  View,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { scheduleOnRN } from "react-native-worklets";

export default function ModalLogin({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      // reset modal position when reopened
      translateX.value = 0;
    }
  }, [isOpen, translateX]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
    })
    .onFinalize(() => {
      const threshold = 150; // Minimum swipe distance to trigger close

      if (Math.abs(translateX.value) > threshold) {
        // If swipe distance exceeds threshold, close the modal
        translateX.value = withTiming(
          translateX.value > 0 ? 500 : -500,
          { duration: 200 },
          () => {
            scheduleOnRN(onClose);
          },
        );
      } else {
        // Otherwise, spring back to original position
        translateX.value = withSpring(0, {
          stiffness: 180,
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
    <GestureDetector gesture={pan}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="absolute inset-0 z-50 bg-black/50 items-center justify-center flex-1">
          <Animated.View
            className="bg-slate-900 relative mx-auto rounded-xl h-1/2 w-[85vw] max-w-md z-0 border-[1.5px] border-slate-600"
            style={[
              animatedStyle,
              {
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 20,
              },
            ]}
          >
            <Pressable onPress={onClose} className="absolute top-4 right-4">
              <CircleX size={30} color="#f3f4f6" />
            </Pressable>
            <View className="flex-1">{children}</View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </GestureDetector>
  );
}
