import { memo, useState, useCallback } from "react";
import { View, LayoutChangeEvent } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyText from "@/components/BodyText";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { Play, Pause } from "lucide-react-native";

interface ChatVoicePlayerProps {
  uri: string;
  durationMs: number | null;
  isOwn: boolean;
}

function ChatVoicePlayerInner({ uri, durationMs, isOwn }: ChatVoicePlayerProps) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  const durationSec = status.duration ?? (durationMs ?? 0) / 1000;
  const progress = durationSec > 0 ? status.currentTime / durationSec : 0;
  const isPlaying = status.playing;

  const smoothProgress = useDerivedValue(() => {
    return withTiming(progress, { duration: 300 });
  });

  const seekTo = useCallback(
    async (progressValue: number) => {
      const seekTime = progressValue * durationSec;
      await player.seekTo(seekTime);
    },
    [player, durationSec],
  );

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      const tapProgress = Math.max(0, Math.min(1, e.x / barWidth));
      seekTo(tapProgress);
    });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${smoothProgress.value * 100}%`,
    };
  });

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const displayMs = Math.min(status.currentTime * 1000, durationMs ?? 0);
  const displayTime =
    status.currentTime > 0
      ? formatDurationNotesVoice(displayMs)
      : formatDurationNotesVoice(durationMs ?? 0);

  const trackClass = isOwn ? "bg-blue-800" : "bg-slate-500";
  const fillClass = isOwn ? "bg-blue-400" : "bg-slate-300";

  return (
    <View className="flex-row items-center gap-2">
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
      >
        {isPlaying ? (
          <Pause size={16} color="white" fill="white" />
        ) : (
          <Play size={16} color="white" fill="white" />
        )}
      </AnimatedButton>

      <GestureDetector gesture={tapGesture}>
        <View className="flex-1 h-6 justify-center" onLayout={onBarLayout}>
          <View className={`h-1 rounded-full ${trackClass}`}>
            <Animated.View
              style={progressStyle}
              className={`h-1 rounded-full ${fillClass}`}
            />
          </View>
        </View>
      </GestureDetector>

      <BodyText className="text-slate-100 text-xs min-w-[32px] text-right">
        {displayTime}
      </BodyText>
    </View>
  );
}

const ChatVoicePlayer = memo(ChatVoicePlayerInner);
export default ChatVoicePlayer;
