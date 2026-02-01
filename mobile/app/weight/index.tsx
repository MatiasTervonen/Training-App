import LinkButton from "@/components/buttons/LinkButton";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import { ChartNoAxesCombined } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function WeightScreen() {
  const { t } = useTranslation("weight");

  return (
    <PageContainer>
      <AppText className="mb-10 text-center text-2xl">{t("weight.title")}</AppText>
      <View className="gap-4">
        <LinkButton href="/weight/tracking" label={t("weight.tracking")} />
        <View className="border border-gray-400 rounded-md" />
        <LinkButton href="/weight/analytics" label={t("weight.analytics")}>
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
