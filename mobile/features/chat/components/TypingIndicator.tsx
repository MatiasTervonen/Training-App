import { useEffect } from "react";
import { View } from "react-native";
import BodyTextNC from "@/components/BodyTextNC";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={style}
      className="w-1.5 h-1.5 rounded-full bg-slate-400"
    />
  );
}

export default function TypingIndicator({ visible }: { visible: boolean }) {
  const { t } = useTranslation("chat");

  if (!visible) return null;

  return (
    <View className="px-4 pb-1">
      <View className="flex-row items-center gap-1.5">
        <View className="flex-row gap-0.5">
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
        <BodyTextNC className="text-xs text-slate-400">
          {t("chat.typing")}
        </BodyTextNC>
      </View>
    </View>
  );
}
