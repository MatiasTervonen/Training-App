import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { useTimerStore } from "@/lib/stores/timerStore";
import { ChartNoAxesCombined, List } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function SessionsScreen() {
  const { t } = useTranslation("activities");
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = () => {
    if (activeSession && activeSession?.type !== "activity") {
      Toast.show({
        type: "error",
        text1: t("activities.activeSessionError"),
        text2: t("activities.activeSessionErrorSub"),
      });
      return false;
    }

    return true;
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">{t("activities.title")}</AppText>
      <View className="gap-4">
        <LinkButton
          label={t("activities.startActivity")}
          href="/activities/start-activity"
          onPress={handleClick}
        />
        <LinkButton label={t("activities.templates")} href="/activities/templates" />
        <View className="border border-gray-400 rounded-md" />
        <LinkButton label={t("activities.addActivity")} href="/activities/add-activity" />
        <LinkButton label={t("activities.editActivity")} href="/activities/edit-activity" />

        <View className="border border-gray-400 rounded-md" />
        <LinkButton label={t("activities.analytics")} href="/activities/analytics">
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
        <LinkButton label={t("activities.mySessions.title")} href="/activities/my-sessions">
          <List color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
