import LinkButton from "@/components/buttons/LinkButton";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import { ChartNoAxesCombined } from "lucide-react-native";

export default function WeightScreen() {
  return (
    <PageContainer>
      <AppText className="mb-10 text-center text-2xl">Weight Tracking</AppText>
      <View className="gap-4">
        <LinkButton href="/weight/tracking" label="Tracking" />
        <View className="border border-gray-400 rounded-md" />
        <LinkButton href="/weight/analytics" label="Analytics">
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
