import { View } from "react-native";
import AppText from "../components/AppText";
import LinkButton from "../components/LinkButton";
import LogoutButton from "../components/LogoutButton";

export default function SettingsScreen() {
  return (
    <View className="px-6 flex-1">
      <AppText className="text-2xl text-center my-5">Menu</AppText>
      <View className="justify-between flex-1">
        <LinkButton href="/settings">
          <AppText>Settings</AppText>
        </LinkButton>
        <View className="mb-10">
          <LogoutButton />
        </View>
      </View>
    </View>
  );
}
