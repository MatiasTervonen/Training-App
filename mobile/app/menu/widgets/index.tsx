import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { Link2, Footprints, Info } from "lucide-react-native";

export default function WidgetsHubPage() {
  const { t } = useTranslation("widgets");

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">
        {t("widgets.hub.title")}
      </AppText>
      <View className="flex-row items-start gap-2 bg-card rounded-xl p-4 mb-6">
        <Info size={18} color="#9ca3af" className="mt-0.5" />
        <AppText className="text-sm text-gray-400 flex-1">
          {t("widgets.hub.info")}
        </AppText>
      </View>
      <View className="gap-4">
        <LinkButton
          label={t("widgets.hub.quickLinks")}
          href="/menu/widgets/quick-links"
        >
          <Link2 color="#f3f4f6" />
        </LinkButton>
        <LinkButton
          label={t("widgets.hub.steps")}
          href="/menu/widgets/steps"
        >
          <Footprints color="#f3f4f6" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
