import { View } from "react-native";
import AppText from "../components/AppText";


export default function ChatPage() {
  return (
    <View className="flex flex-col items-center justify-center h-screen">
      <AppText className="text-6xl text-center">
        Chat with AI
      </AppText>
      <AppText className="mt-4 text-lg text-gray-600">
        Start a conversation with our AI assistant.
      </AppText>
    </View>
  );
}