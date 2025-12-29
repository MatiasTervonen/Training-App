import { View, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import AppText from "@/components/AppText";
import Toast from "react-native-toast-message";

export default function CopyText({ textToCopy }: { textToCopy: string }) {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(textToCopy);
    Toast.show({
      type: "success",
      text1: "Copied to Clipboard",
    });
  };

  return (
    <View className="justify-center items-center">
      <Pressable
        onPress={copyToClipboard}
        className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 px-6"
      >
        <AppText>Copy to Clipboard</AppText>
      </Pressable>
    </View>
  );
}
