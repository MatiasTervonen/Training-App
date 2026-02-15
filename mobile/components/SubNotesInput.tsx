import { useState, useEffect, useRef } from "react";
import { TextInputProps, View, TextInput } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type SubNotesInputProps = TextInputProps & {
  value: string;
  setValue: (value: string) => void;
  label?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
};

const DEFAULT_MIN_HEIGHT = 60;
const DEFAULT_MAX_HEIGHT = 150;

export default function SubNotesInput({
  value,
  setValue,
  label,
  className,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  ...props
}: SubNotesInputProps) {
  const { t } = useTranslation();
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(minHeight);
  const valueRef = useRef(value);
  valueRef.current = value;

  const scrollEnabled = contentHeight > maxHeight;

  useEffect(() => {
    if (value.length === 0) {
      setContentHeight(0);
      animatedHeight.value = withTiming(minHeight, { duration: 100 });
    }
  }, [value, animatedHeight, minHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: "hidden" as const,
  }));

  return (
    <View>
      {label && <AppText className="text-gray-300 mb-1">{label}</AppText>}
      <View className="border-2 rounded-lg overflow-hidden border-gray-400 focus:border-green-500">
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <Animated.View style={animatedStyle}>
          <TextInput
            placeholderTextColor={"#9ca3af"}
            autoComplete="off"
            spellCheck={false}
            autoCorrect={false}
            multiline
            scrollEnabled={scrollEnabled}
            textAlignVertical="top"
            value={value}
            onChangeText={setValue}
            onContentSizeChange={(e) => {
              if (valueRef.current.length === 0) return;
              const newContentHeight = e.nativeEvent.contentSize.height;
              setContentHeight(newContentHeight);
              const clamped = Math.min(
                Math.max(newContentHeight, minHeight),
                maxHeight,
              );
              animatedHeight.value = withTiming(clamped, { duration: 100 });
            }}
            className={`p-3 text-gray-100 font-lexend text-[15px] leading-[24px] ${className ?? ""}`}
            style={{ height: maxHeight, lineHeight: 20 }}
            maxLength={500000}
            {...props}
          />
        </Animated.View>
        {value.length >= 500000 ? (
          <AppText className="text-yellow-400 mt-2">
            {t("common.charLimitReached", { max: 500000 })}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
