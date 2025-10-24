import AppText from "./AppText";
import { View } from "react-native";
import Toggle from "./toggle";

export default function PushNotificationManager() {
  return (
    <View>
      <AppText className="text-lg font-semibold mb-4">
        Push Notifications
      </AppText>
      <Toggle isOn={true} onToggle={() => {}} />
    </View>
  );
}
