import LinkButton from "@/components/buttons/LinkButton";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";

export default function WeightScreen() {
  return (
    <PageContainer>
      <AppText className="mb-10 text-center text-2xl">Weight Tracking</AppText>
      <View className="gap-4">
        <LinkButton href="/weight/tracking" label="Tracking" />
        <LinkButton href="/weight/analytics" label="Analytics" />
      </View>
    </PageContainer>
  );
}
