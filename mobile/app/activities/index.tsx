import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { useTimerStore } from "@/lib/stores/timerStore";

export default function SessionsScreen() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = () => {
    if (activeSession && activeSession?.type !== "activity") {
      Toast.show({
        type: "error",
        text1: "You already have an active session.",
        text2: "Finish it before starting a new one.",
      });
      return false;
    }

    return true;
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Start Activity</AppText>
      <View className="gap-4">
        <LinkButton
          label="Start Activity"
          href="/activities/start-activity"
          onPress={handleClick}
        />
      </View>
    </PageContainer>
  );
}
