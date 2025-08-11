import { View } from "react-native";
import AppText from "@/components/AppText";
import ModalPageWrapper from "@/components/ModalPageWrapper";


export default function SettingsScreen() {
  return (
    <ModalPageWrapper>
      <View className="flex flex-col items-center my-5">
        <AppText className="text-2xl text-center">Timer</AppText>
      </View>
    </ModalPageWrapper>
  );
}
