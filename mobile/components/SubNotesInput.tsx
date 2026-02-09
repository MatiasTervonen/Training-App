import { useRef, useState, useEffect } from "react";
import { TextInputProps, View, TextInput } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type NotesInputProps = TextInputProps & {
  value: string;
  setValue: (value: string) => void;
  label?: string;
  className?: string;
  minHeight?: number;
};

const DEFAULT_MIN_HEIGHT = 60;

export default function SubNotesInput({
  value,
  setValue,
  label,
  className,
  minHeight = DEFAULT_MIN_HEIGHT,
  ...props
}: NotesInputProps) {
  const { t } = useTranslation();
  const textRef = useRef(value);
  const animatedHeight = useSharedValue(minHeight);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (value.length === 0 && textRef.current.length > 0) {
      textRef.current = "";
      animatedHeight.value = withTiming(minHeight, { duration: 100 });
      setInputKey((k) => k + 1);
    }
  }, [value, animatedHeight, minHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: "hidden",
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
            key={inputKey}
            placeholderTextColor={"#9ca3af"}
            autoComplete="off"
            spellCheck={false}
            autoCorrect={false}
            multiline
            textAlignVertical="top"
            defaultValue={value}
            onChangeText={(text) => {
              textRef.current = text;
              setValue(text);
            }}
            onContentSizeChange={(e) => {
              if (textRef.current.length === 0) {
                animatedHeight.value = withTiming(minHeight, { duration: 100 });
                return;
              }
              const newHeight = Math.max(
                minHeight,
                e.nativeEvent.contentSize.height
              );
              animatedHeight.value = withTiming(newHeight, { duration: 100 });
            }}
            className={`pl-3 text-gray-100 font-russo text-lg ${className}`}
            style={{ height: 1000, lineHeight: 20 }}
            maxLength={500}
            {...props}
          />
        </Animated.View>
        {value.length >= 500 ? (
          <AppText className="text-yellow-400 mt-2">
            {t("common.charLimitReached", { max: 500 })}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
