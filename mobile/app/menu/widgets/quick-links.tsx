import { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import Toggle from "@/components/toggle";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { useAutoSave } from "@/hooks/useAutoSave";
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

  const autoSaveData = useMemo(
    () => (loaded ? { selectedLinks: [...selectedLinks].sort() } : undefined),
    [loaded, selectedLinks],
  );

  const handleAutoSave = useCallback(async () => {
    const config = { selectedLinks };
    await saveGlobalQuickLinksConfig(config);
    requestWidgetUpdate({
      widgetName: "QuickLinks",
      renderWidget: (widgetInfo) => (
        <QuickLinksWidget config={config} widgetInfo={widgetInfo} />
      ),
    }).catch(() => {});
  }, [selectedLinks]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: loaded,
  });

  if (!loaded) return null;

  return (
    <PageContainer>
      <AutoSaveIndicator status={status} />

      <AppText className="text-2xl text-center mb-4">
        {t("widgets.quickLinks.configTitle")}
      </AppText>
      <AppText className="text-gray-400 text-center mb-6">
        {t("widgets.quickLinks.selectPages")}
      </AppText>

      <View className="gap-3">
        {LINK_TARGETS.map((target) => (
          <View
            key={target.key}
            className="flex-row justify-between items-center py-3 px-4 bg-slate-500/10 border border-slate-500/20 rounded-lg"
          >
            <AppText className="text-lg">{getLabel(target)}</AppText>
            <Toggle
              isOn={selectedLinks.includes(target.key)}
              onToggle={() => toggleLink(target.key)}
            />
          </View>
        ))}
      </View>

      {selectedLinks.length === 0 && (
        <AppText className="text-yellow-500 text-center mt-3">
          {t("widgets.quickLinks.noLinksSelected")}
        </AppText>
      )}
    </PageContainer>
  );
}
