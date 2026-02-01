import AppText from "@/components/AppText";
import { Globe, Info } from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Modal, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function SessionsScreen() {
  const { t } = useTranslation("reminders");
  const [showModal, setShowModal] = useState(false);

  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);

  useEffect(() => {
    if (pushEnabled === false) {
      setShowModal(true);
    }
  }, [pushEnabled]);

  return (
    <>
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">{t("reminders.title")}</AppText>
        <View className="gap-4">
          <LinkButton label={t("reminders.oneTimeGlobal")} href="/reminders/global-reminder">
            <Globe color="#f3f4f6" />
          </LinkButton>
          <View className="border border-gray-400 rounded-md" />
          <LinkButton label={t("reminders.oneTime")} href="/reminders/onetime-reminder" />
          <LinkButton label={t("reminders.weekly")} href="/reminders/weekly-reminder" />
          <LinkButton label={t("reminders.daily")} href="/reminders/daily-reminder" />
          <View className="border border-gray-400 rounded-md" />
          <LinkButton label={t("reminders.myReminders")} href="/reminders/my-reminders" />
        </View>
      </PageContainer>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              {t("reminders.pushDisabledTitle")}
            </AppText>
            <AppText className="text-lg mb-6 text-center">
              {t("reminders.pushDisabledMessage")}
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <LinkButton href="/sessions" label={t("reminders.back")} />
              </View>
              <View className="flex-1">
                <LinkButton href="/menu/settings" label={t("reminders.settings")} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
