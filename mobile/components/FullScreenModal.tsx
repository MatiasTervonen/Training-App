import { ReactNode, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal } from "react-native-paper";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";

export default function FullScreenModal({
  isOpen,
  onClose,
  children,
  confirmBeforeClose = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  confirmBeforeClose?: boolean;
}) {
  const translateX = useSharedValue(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  const fullScreenModalConfig = useFullScreenModalConfig(
    (state) => state.fullScreenModalConfig
  );
  const swipeEnabled = fullScreenModalConfig?.swipeEnabled ?? true;

  // Max width == max-w-3xl (768px) for the count of swipe dinstance to navigation

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  useEffect(() => {
    if (isOpen) {
      // reset modal position when reopened
      translateX.value = 0;
      setShowConfirm(false);
    }
  }, [isOpen, translateX]);

  const handleClose = () => {
    if (confirmBeforeClose) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  const pan = Gesture.Pan()
    .enabled((swipeEnabled ?? true) && !showConfirm)
    .activeOffsetX([-40, 40])
    .failOffsetY([-12, 12])
    .onChange((event) => {
      translateX.value = event.translationX * 0.7;
    })
    .onFinalize(() => {
      const threshold = screenWidth * 0.2; // Minimum swipe distance to trigger close
      const exitDistance = screenWidth * 1.2; // Distance to move off-screen

      if (Math.abs(translateX.value) > threshold) {
        if (confirmBeforeClose) {
          // Spring back to center and show confirmation immediately
          translateX.value = withSpring(0, {
            stiffness: 220,
            damping: 15,
            mass: 1,
          });
          runOnJS(handleClose)();
        } else {
          // Animate off-screen and close
          translateX.value = withTiming(
            translateX.value > 0 ? exitDistance : -exitDistance,
            { duration: 300 },
            () => {
              runOnJS(onClose)();
            }
          );
        }
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
              onPress={handleClose}
              className="absolute top-4 right-4 z-[999]"
              hitSlop={10}
            >
              <CircleX size={30} color="#f3f4f6" />
            </Pressable>
            <View
              className="flex-1 max-w-xl px-2 w-full"
              style={{ paddingBottom: insets.bottom }}
            >
              {children}
            </View>

            {showConfirm && (
              <View className="absolute inset-0 bg-black/70 items-center justify-center z-50 rounded-t-2xl">
                <View className="bg-slate-800 border border-slate-600 rounded-xl p-6 mx-4 w-full max-w-sm">
                  <AppText className="text-lg text-center mb-6">
                    You have unsaved changes. Discard them?
                  </AppText>
                  <View className="flex-row gap-3">
                    <AnimatedButton
                      onPress={() => setShowConfirm(false)}
                      tabClassName="flex-1"
                      className="btn-base py-3"
                      label="Keep editing"
                      textClassName="text-center text-gray-100"
                    />
                    <AnimatedButton
                      onPress={() => {
                        setShowConfirm(false);
                        onClose();
                      }}
                      tabClassName="flex-1"
                      className="btn-danger py-3"
                      label="Discard"
                      textClassName="text-center text-gray-100"
                    />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </GestureDetector>
    </Portal>
  );
}
