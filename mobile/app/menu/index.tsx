import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import LogoutButton from "@/Features/login-signup/LogoutButton";
import { ShieldUser, UserPen, Settings } from "lucide-react-native";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation(["menu"]);

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">
        {t("menu.title")}
      </AppText>
      <View className="justify-between flex-1">
        <View className="gap-4">
          {/* <LinkButton label="Friends" href="/menu/friends">
            <ContactRound color="white" />
          </LinkButton> */}
          <LinkButton label={t("menu.profile")} href="/menu/profile">
            <UserPen color="#f3f4f6" />
          </LinkButton>
          <LinkButton label={t("menu.security")} href="/menu/security">
            <ShieldUser color="#f3f4f6" />
          </LinkButton>
          <LinkButton label={t("menu.settings")} href="/menu/settings">
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
