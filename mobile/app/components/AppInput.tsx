import AppText from "./AppText";
import { View, TextInput, TextInputProps } from "react-native";

type AppInputProps = TextInputProps & {
  label: string;
};

export default function AppInput({ label, ...props }: AppInputProps) {
  return (
    <View>
      <AppText className="mb-2">{label}</AppText>
      <TextInput
        placeholderTextColor={"#9ca3af"}
        className="border-2 pl-3 border-gray-300 rounded-lg p-2 text-gray-100 bg-[#0f172b] focus:border-green-500"
        {...props}
      />
    </View>
  );
}
