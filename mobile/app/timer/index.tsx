import AppText from "@/components/AppText";
import LinkButton from "@/components/LinkButton";
import PageContainer from "@/components/PageContainer";

export default function TimerScreen() {
  return (
    <PageContainer className="gap-4">
      <AppText className="text-2xl text-center my-5">Timer</AppText>
      <LinkButton label="Create Timer" href="/timer/create-timer" />
      <LinkButton label="Empty Timer" href="/timer/empty-timer" />
      <LinkButton label="My Timers" href="/timer/my-timers" />
    </PageContainer>
  );
}
