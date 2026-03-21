import { View, Modal, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { X } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useCallback } from "react";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DISMISS_THRESHOLD = 150;

export default function VideoPlayerModal({ uri, visible, onClose }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const insets = useSafeAreaInsets();

  const dismissY = useSharedValue(0);
  const bgOpacity = useSharedValue(1);
  const startY = useSharedValue(0);

  const handleClose = useCallback(() => {
    player.pause();
    onClose();
  }, [player, onClose]);

  const resetValues = useCallback(() => {
    dismissY.value = 0;
    bgOpacity.value = 1;
  }, [dismissY, bgOpacity]);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      if (e.numberOfTouches === 1) {
        startY.value = e.allTouches[0].absoluteY;
      }
    })
    .onTouchesMove((e, state) => {
      if (e.numberOfTouches === 1) {
        const dy = Math.abs(e.allTouches[0].absoluteY - startY.value);
        if (dy > 10) {
          state.activate();
        }
      }
    })
    .onUpdate((e) => {
      dismissY.value = e.translationY;
      bgOpacity.value = Math.max(
        0.3,
        1 - Math.abs(e.translationY) / (SCREEN_HEIGHT * 0.4),
      );
    })
    .onEnd(() => {
      if (Math.abs(dismissY.value) > DISMISS_THRESHOLD) {
        bgOpacity.value = withTiming(0, { duration: 200 });
        dismissY.value = withTiming(
          dismissY.value > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
          { duration: 200 },
          () => {
            scheduleOnRN(handleClose);
            scheduleOnRN(resetValues);
          },
        );
      } else {
        dismissY.value = withTiming(0);
        bgOpacity.value = withTiming(1);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={handleClose}
      animationType="fade"
      statusBarTranslucent
    >
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1">
          <Animated.View
            className="absolute inset-0 bg-black"
            style={bgStyle}
          />
          <GestureDetector gesture={panGesture}>
            <Animated.View className="flex-1" style={contentStyle}>
              <View
                className="flex-1"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
              >
                <VideoView
                  player={player}
                  style={{ width: "100%", height: "100%" }}
                  nativeControls
                  fullscreenOptions={{ enable: true }}
                />
              </View>
            </Animated.View>
          </GestureDetector>
          <View
            className="absolute right-4 z-10"
            style={{ top: insets.top + 8 }}
          >
            <AnimatedButton
              onPress={handleClose}
              className="bg-slate-800 border-slate-600 border-[1.5px] rounded-full p-2"
            >
              <X color="white" size={24} />
            </AnimatedButton>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
