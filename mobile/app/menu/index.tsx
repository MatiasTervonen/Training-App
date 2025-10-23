import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/LinkButton";
import LogoutButton from "@/components/login-signup/LogoutButton";
import { ShieldUser, UserPen, ContactRound } from "lucide-react-native";
import PageContainer from "@/components/PageContainer";

export default function SettingsScreen() {
  return (
      <PageContainer>
        <AppText className="text-2xl text-center my-5">Menu</AppText>
        <View className="justify-between flex-1">
          <View className="gap-4">
            <LinkButton label="Friends" href="/menu/friends">
              <ContactRound color="white" />
            </LinkButton>
            <LinkButton label="Profile" href="/menu/profile">
              <UserPen color="white" />
            </LinkButton>
            <LinkButton label="Security" href="/menu/security">
              <ShieldUser color="white" />
            </LinkButton>
          </View>
          <View className="mb-10">
            <LogoutButton />
          </View>
        </View>
      </PageContainer>
  );
}
