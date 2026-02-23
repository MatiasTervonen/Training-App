import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { Link2, Footprints } from "lucide-react-native";

export default function WidgetsHubPage() {
  const { t } = useTranslation("widgets");

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">
        {t("widgets.hub.title")}
      </AppText>
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
