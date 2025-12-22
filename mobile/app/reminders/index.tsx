import AppText from "@/components/AppText";
import { Globe, Info } from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Modal, View } from "react-native";

export default function SessionsScreen() {
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
        <AppText className="text-2xl text-center mb-10">Reminders</AppText>
        <View className="gap-4">
          <LinkButton label="One-Time Global" href="/reminders/global-reminder">
            <Globe color="#f3f4f6" />
          </LinkButton>
          <LinkButton
            label="One-Time local"
            href="/reminders/onetime-reminder"
          />
          <LinkButton label="Weekly" href="/reminders/weekly-reminder" />
          <LinkButton label="Daily" href="/reminders/daily-reminder" />
          <LinkButton label="My Reminders" href="/reminders/my-reminders" />
        </View>
      </PageContainer>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              Push notifications disabled.
            </AppText>
            <AppText className="text-lg mb-6 text-center">
              Enable push notifications from settings to receive reminders.
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <LinkButton href="/sessions" label="Back" />
              </View>
              <View className="flex-1">
                <LinkButton href="/menu/settings" label="Settings" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
