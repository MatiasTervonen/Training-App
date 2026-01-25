import { View, LayoutChangeEvent } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useState, useCallback, useRef } from "react";
import { Play, Pause, Delete } from "lucide-react-native";

export function DraftRecordingItem({
  uri,
  durationMs,
  deleteRecording,
}: {
  uri: string;
  durationMs?: number;
  deleteRecording?: () => void;
}) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  const durationSec = status.duration ?? (durationMs ?? 0) / 1000;
  const progress = durationSec > 0 ? status.currentTime / durationSec : 0;
  const isPlaying = status.playing;

  // For dragging
  const isDragging = useSharedValue(false);
  const dragProgress = useSharedValue(0);
  const playingBeforeSeek = useRef<boolean>(false);

  // Smooth progress that animates between player updates
  const smoothProgress = useDerivedValue(() => {
    if (isDragging.value) {
      return dragProgress.value; // No animation during drag for immediate feedback
    }
    // Animate smoothly between progress updates (~100ms for responsive feel)
    return withTiming(progress, { duration: 300 });
  });

  const seekTo = useCallback(
    async (progressValue: number) => {
      const seekTime = progressValue * durationSec;
      await player.seekTo(seekTime);
    },
    [player, durationSec],
  );

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      isDragging.value = true;
      playingBeforeSeek.current = status.playing;
      if (status.playing) {
        player.pause();
      }
      dragProgress.value = Math.max(0, Math.min(1, e.x / barWidth));
    })
    .onUpdate((e) => {
      dragProgress.value = Math.max(0, Math.min(1, e.x / barWidth));
    })
    .onEnd(async () => {
      isDragging.value = false;
      await seekTo(dragProgress.value);
      if (playingBeforeSeek.current) {
        player.play();
      }
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      isDragging.value = false;
      const tapProgress = Math.max(0, Math.min(1, e.x / barWidth));
      seekTo(tapProgress);
    });

  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${smoothProgress.value * 100}%`,
    };
  });

  const dotStyle = useAnimatedStyle(() => {
    return {
      left: smoothProgress.value * barWidth - 6,
    };
  });

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View className="bg-slate-950 rounded-xl border-2 border-blue-500 mb-4">
      {/* Play/Pause Button */}
      <View className="bg-slate-900 px-4 py-3 rounded-t-xl flex-row justify-between items-center">
        <AnimatedButton
          hitSlop={10}
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          onPress={async () => {
            if (isPlaying) {
              player.pause();
            } else {
              await setAudioModeAsync({ allowsRecording: false });
              if (durationSec > 0 && status.currentTime >= durationSec - 0.1) {
                player.seekTo(0);
              }
              player.play();
            }
          }}
          className="gap-3"
        >
          <View className="flex-row gap-4">
            <View className="flex-row items-center gap-2">
              <AppText className="text-gray-100">
                {isPlaying ? "Pause" : "Play"}
              </AppText>
              {isPlaying ? (
                <Pause size={18} color="white" fill="white" />
              ) : (
                <Play size={18} color="white" fill="white" />
              )}
            </View>
            <AppText className="text-slate-400">
              {formatDurationNotesVoice(status.currentTime * 1000)} /{" "}
              {formatDurationNotesVoice(durationMs)}
            </AppText>
          </View>
        </AnimatedButton>
        {deleteRecording && (
          <AnimatedButton onPress={deleteRecording} hitSlop={10}>
            <Delete color="red" />
          </AnimatedButton>
        )}
      </View>
      <GestureDetector gesture={combinedGesture}>
        <View
          className="flex-1 h-6 justify-center mx-4 py-6"
          onLayout={onBarLayout}
        >
          {/* Track background */}
          <View className="h-1 bg-slate-600 rounded-full">
            {/* Progress fill */}
            <Animated.View
              style={progressStyle}
              className="h-1 bg-blue-500 rounded-full"
            />
          </View>
          {/* Draggable dot */}
          <Animated.View
            style={dotStyle}
            className="absolute w-3 h-3 bg-blue-500 rounded-full"
          />
        </View>
      </GestureDetector>
    </View>
  );
}
