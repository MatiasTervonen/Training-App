import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal } from "react-native-paper";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import { scheduleOnRN } from "react-native-worklets";

type FullScreenModalScrollContextType = {
  innerScrollY: SharedValue<number>;
};

const FullScreenModalScrollContext =
  createContext<FullScreenModalScrollContextType | null>(null);

export function useFullScreenModalScroll() {
  return useContext(FullScreenModalScrollContext);
}

export default function FullScreenModal({
  isOpen,
  onClose,
  children,
  confirmBeforeClose = false,
  scrollable = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  confirmBeforeClose?: boolean;
  scrollable?: boolean;
}) {
  const { t } = useTranslation("common");
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const innerScrollY = useSharedValue(0);
  const startY = useSharedValue(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  const fullScreenModalConfig = useFullScreenModalConfig(
    (state) => state.fullScreenModalConfig,
  );
  const swipeEnabled = fullScreenModalConfig?.swipeEnabled ?? true;

  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    if (isOpen) {
      translateY.value = 0;
      scrollY.value = 0;
      innerScrollY.value = 0;
      setShowConfirm(false);
    }
  }, [isOpen, translateY, scrollY]);

  const handleClose = () => {
    if (confirmBeforeClose) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onChangeHandler = (event: { translationY: number }) => {
    'worklet';
    translateY.value = Math.max(0, event.translationY * 0.7);
  };

  const onFinalizeHandler = (_event: unknown, success: boolean) => {
    'worklet';
    const threshold = screenHeight * 0.15;

    if (success && translateY.value > threshold) {
      if (confirmBeforeClose) {
        translateY.value = withSpring(0, {
          stiffness: 220,
          damping: 15,
          mass: 1,
        });
        scheduleOnRN(handleClose);
      } else {
        translateY.value = withTiming(
          screenHeight,
          { duration: 300 },
          () => {
            scheduleOnRN(onClose);
          },
        );
      }
    } else {
      translateY.value = withSpring(0, {
        stiffness: 220,
        damping: 15,
        mass: 1,
      });
    }
  };

  // scrollable: modal owns the ScrollView, dismiss only at top
  const scrollablePan = Gesture.Pan()
    .enabled((swipeEnabled ?? true) && !showConfirm)
    .manualActivation(true)
    .onTouchesDown((e) => {
      'worklet';
      if (e.numberOfTouches === 1) {
        startY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e, state) => {
      'worklet';
      if (e.numberOfTouches === 1) {
        const dy = e.allTouches[0].absoluteY - startY.value;
        if (dy > 15 && scrollY.value <= 1) {
          state.activate();
        } else if (dy < -15 || dy > 15) {
          state.fail();
        }
      }
    })
    .onChange(onChangeHandler)
    .onFinalize(onFinalizeHandler);

  // non-scrollable: children have their own scroll, only dismiss when inner scroll is at top
  const nonScrollablePan = Gesture.Pan()
    .enabled((swipeEnabled ?? true) && !showConfirm)
    .manualActivation(true)
    .onTouchesDown((e) => {
      'worklet';
      if (e.numberOfTouches === 1) {
        startY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e, state) => {
      'worklet';
      if (e.numberOfTouches === 1) {
        const dy = e.allTouches[0].absoluteY - startY.value;
        if (dy > 15 && innerScrollY.value <= 1) {
          state.activate();
        } else if (dy < -15 || dy > 15) {
          state.fail();
        }
      }
    })
    .onChange(onChangeHandler)
    .onFinalize(onFinalizeHandler);

  const pan = scrollable ? scrollablePan : nonScrollablePan;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isOpen) return null;

  return (
    <Portal>
      <GestureDetector gesture={pan}>
        <View className="absolute inset-0 bg-black/50 flex-1 z-50 justify-end items-center">
          <Animated.View
            className="rounded-t-2xl h-[95%] w-full z-50 max-w-3xl overflow-hidden"
            style={[animatedStyle]}
          >
            <View className="flex-1 bg-[#1d293d]">
              {scrollable ? (
                <Animated.ScrollView
                  className="flex-1"
                  contentContainerStyle={{ flexGrow: 1 }}
                  scrollEventThrottle={16}
                  onScroll={scrollHandler}
                  showsVerticalScrollIndicator={false}
                >
                  <View
                    className="flex-1 max-w-xl px-2 w-full"
                    style={{ paddingBottom: insets.bottom }}
                  >
                    {children}
                  </View>
                </Animated.ScrollView>
              ) : (
                <FullScreenModalScrollContext.Provider value={{ innerScrollY }}>
                  <View
                    className="flex-1 max-w-xl px-2 w-full"
                    style={{ paddingBottom: insets.bottom }}
                  >
                    {children}
                  </View>
                </FullScreenModalScrollContext.Provider>
              )}

              {showConfirm && (
                <View className="absolute inset-0 bg-black/70 items-center justify-center z-50 rounded-t-2xl">
                  <View className="bg-slate-800 border border-slate-600 rounded-xl p-6 mx-4 w-full max-w-sm">
                    <AppText className="text-lg text-center mb-6">
                      {t("common.unsavedChangesDiscard")}
                    </AppText>
                    <View className="flex-row gap-3">
                      <AnimatedButton
                        onPress={() => setShowConfirm(false)}
                        className="flex-1 btn-base py-3"
                        label={t("common.keepEditing")}
                        textClassName="text-center text-gray-100"
                      />
                      <AnimatedButton
                        onPress={() => {
                          setShowConfirm(false);
                          onClose();
                        }}
                        className="flex-1 btn-danger py-3"
                        label={t("common.discard")}
                        textClassName="text-center text-gray-100"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </Portal>
  );
}
