import { useState, useEffect } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { requestWidgetUpdate } from "react-native-android-widget";
import { QuickLinksWidget } from "@/features/widgets/QuickLinksWidget";
import {
  LINK_TARGETS,
  DEFAULT_QUICK_LINKS_CONFIG,
} from "@/features/widgets/widget-constants";
import {
  getGlobalQuickLinksConfig,
  saveGlobalQuickLinksConfig,
} from "@/features/widgets/widget-storage";

export default function QuickLinksConfigPage() {
  const { t, i18n } = useTranslation("widgets");
  const router = useRouter();
  const [selectedLinks, setSelectedLinks] = useState<string[]>(
    DEFAULT_QUICK_LINKS_CONFIG.selectedLinks,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGlobalQuickLinksConfig().then((config) => {
      setSelectedLinks(config.selectedLinks);
      setLoaded(true);
    });
  }, []);

  const toggleLink = (key: string) => {
    setSelectedLinks((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const getLabel = (target: (typeof LINK_TARGETS)[number]) => {
    return i18n.language === "fi" ? target.labelFi : target.labelEn;
  };

  const handleSave = async () => {
    const config = { selectedLinks };
    await saveGlobalQuickLinksConfig(config);
    requestWidgetUpdate({
      widgetName: "QuickLinks",
      renderWidget: (widgetInfo) => (
        <QuickLinksWidget config={config} widgetInfo={widgetInfo} />
      ),
    }).catch(() => {});
    Toast.show({ type: "success", text1: t("widgets.quickLinks.saved") });
    router.back();
  };

  if (!loaded) return null;

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-4">
        {t("widgets.quickLinks.configTitle")}
      </AppText>
      <AppText className="text-gray-400 text-center mb-6">
        {t("widgets.quickLinks.selectPages")}
      </AppText>

      <View className="flex-1 justify-between">
        <View className="gap-3">
          {LINK_TARGETS.map((target) => (
            <View
              key={target.key}
              className="flex-row justify-between items-center py-3 px-4 bg-slate-800 rounded-lg"
            >
              <AppText className="text-lg">{getLabel(target)}</AppText>
              <Toggle
                isOn={selectedLinks.includes(target.key)}
                onToggle={() => toggleLink(target.key)}
              />
            </View>
          ))}
        </View>

        <View>
          {selectedLinks.length === 0 && (
            <AppText className="text-yellow-500 text-center mb-3">
              {t("widgets.quickLinks.noLinksSelected")}
            </AppText>
          )}

          <AnimatedButton
            label={t("widgets.quickLinks.save")}
            onPress={handleSave}
            className="btn-base"
            disabled={selectedLinks.length === 0}
          />
        </View>
      </View>
    </PageContainer>
  );
}
