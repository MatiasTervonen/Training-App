import { View } from "react-native";
import AppText from "@/components/AppText";

export default function ChatPage() {
  return (
    <View className="flex flex-col items-center mt-10 px-4">
      <AppText className="text-6xl text-center">Chat with AI</AppText>
      <AppText className="mt-4 text-lg text-gray-400">
        Start a conversation with our AI assistant.
      </AppText>
      <AppText className="mt-4 text-lg text-gray-400 text-center">
        This page is under construction. Please check back later.
      </AppText>
    </View>
  );
}
