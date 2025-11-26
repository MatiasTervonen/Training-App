import { TextInputProps, View, TextInput } from "react-native";
import AppText from "./AppText";
import { LinearGradient } from "expo-linear-gradient";

type NotesInputProps = TextInputProps & {
  value: string;
  setValue: (value: string) => void;
  label?: string;
};

export default function NotesInput({
  value,
  setValue,
  label,
  ...props
}: NotesInputProps) {
  return (
    <View className="flex-1">
      {label && <AppText className="text-gray-300 mb-1">{label}</AppText>}
      <View className="flex-1 border-2 rounded-lg overflow-hidden border-gray-300 focus:border-green-500">
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <TextInput
          placeholderTextColor={"#9ca3af"}
          autoComplete="off"
          spellCheck={false}
          autoCorrect={false}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={setValue}
          className="flex-1 pl-3 text-gray-100 font-russo text-lg"
          style={{ lineHeight: 20 }}
          maxLength={10000}
          {...props}
        />
        {value.length >= 10000 ? (
          <AppText className="text-yellow-400 mt-2">
            Reached the limit (10000 chars max)
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
