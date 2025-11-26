import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";

export default function TimerScreen() {
  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Timer</AppText>
      <View className="gap-4">
        <LinkButton label="Start Timer" href="/timer/empty-timer" />
        <LinkButton label="Create Timer" href="/timer/create-timer" />
        <LinkButton label="My Timers" href="/timer/my-timers" />
      </View>
    </PageContainer>
  );
}
