import { View } from "react-native";
import AppText from "@/app/components/AppText";

export default function ProfileScreen() {
  return (
    <View className="flex flex-col items-center justify-center h-screen">
      <AppText className="text-6xl text-center">Profile</AppText>
    </View>
  );
}