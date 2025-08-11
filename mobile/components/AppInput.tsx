import AppText from "./AppText";
import { View, TextInput, TextInputProps } from "react-native";

type AppInputProps = TextInputProps & {
  label?: string;
};

export default function AppInput({ label, ...props }: AppInputProps) {
  return (
    <View className="">
      <AppText className="mb-2">{label}</AppText>
      <TextInput
        placeholderTextColor={"#9ca3af"}
        autoComplete="off"
        autoCorrect={false}
        textContentType="none"
        importantForAutofill="no"
        allowFontScaling={false}
        className="border-2 pl-3 border-gray-300 rounded-lg p-2 text-lg text-gray-100 bg-slate-900 focus:border-green-500 font-russo"
        {...props}
      />
    </View>
  );
}
