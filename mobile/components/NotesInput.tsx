import { useRef } from "react";
import { TextInputProps, View, TextInput } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
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

const DEFAULT_MIN_HEIGHT = 120;

export default function NotesInput({
  value,
  setValue,
  label,
  className,
  minHeight = DEFAULT_MIN_HEIGHT,
  ...props
}: NotesInputProps) {
  const textRef = useRef(value);
  const animatedHeight = useSharedValue(minHeight);

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
            style={{ height: 3000, lineHeight: 20 }}
            maxLength={10000}
            {...props}
          />
        </Animated.View>
        {value.length >= 10000 ? (
          <AppText className="text-yellow-400 mt-2">
            Reached the limit (10000 chars max)
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
