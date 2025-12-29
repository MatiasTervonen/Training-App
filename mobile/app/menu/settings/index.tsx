import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import PushNotificationManager from "@/Features/push-notifications/pushNotificationManager";
import GpsToggleManager from "@/Features/activities/toggleSettings/gpsToggleManager";
import { View } from "react-native";

export default function SettingsPage() {
  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Settings</AppText>
      <PushNotificationManager />
      <View className="my-5">
        <GpsToggleManager />
      </View>
    </PageContainer>
  );
}
