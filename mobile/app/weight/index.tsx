import LinkButton from "@/components/LinkButton";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";

export default function WeightScreen() {
  return (
    <PageContainer className="gap-4">
      <AppText className="my-5 text-center text-2xl">Weight Tracking</AppText>
      <LinkButton href="/weight/tracking" label="Tracking" />
      <LinkButton href="/weight/analytics" label="Analytics" />
    </PageContainer>
  );
}
