import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";

export default function TimerScreen() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = () => {
    if (activeSession) {
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
      <AppText className="text-2xl text-center mb-10">Timer</AppText>
      <View className="gap-4">
        <LinkButton
          onPress={handleClick}
          label="Start Timer"
          href="/timer/empty-timer"
        />
        <LinkButton label="Create Timer" href="/timer/create-timer" />
        <LinkButton label="My Timers" href="/timer/my-timers" />
      </View>
    </PageContainer>
  );
}
