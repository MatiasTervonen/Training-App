import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import LogoutButton from "@/components/login-signup/LogoutButton";
import { ShieldUser, UserPen, Settings } from "lucide-react-native";
import PageContainer from "@/components/PageContainer";

export default function SettingsScreen() {
  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Menu</AppText>
      <View className="justify-between flex-1">
        <View className="gap-4">
          {/* <LinkButton label="Friends" href="/menu/friends">
            <ContactRound color="white" />
          </LinkButton> */}
          <LinkButton label="Profile" href="/menu/profile">
            <UserPen color="#f3f4f6" />
          </LinkButton>
          <LinkButton label="Security" href="/menu/security">
            <ShieldUser color="#f3f4f6" />
          </LinkButton>
          <LinkButton label="Settings" href="/menu/settings">
            <Settings color="#f3f4f6" />
          </LinkButton> 
        </View>
        <View>
          <LogoutButton />
        </View>
      </View>
    </PageContainer>
  );
}
