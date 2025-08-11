import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/LinkButton";
import LogoutButton from "@/components/LogoutButton";
import ModalPageWrapper from "@/components/ModalPageWrapper";

export default function SettingsScreen() {
  return (
    <ModalPageWrapper leftLabel="feed" rightLabel="feed">
      <View className="px-6 flex-1">
        <AppText className="text-2xl text-center my-5">Menu</AppText>
        <View className="justify-between flex-1">
          <View>
            <LinkButton label="Friends" href="/menu/friends" />
            <LinkButton label="Profile" href="/menu/profile" />
          </View>
          <View className="mb-10">
            <LogoutButton />
          </View>
        </View>
      </View>
    </ModalPageWrapper>
  );
}
