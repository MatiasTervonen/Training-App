import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import StepsShareCard from "@/features/activities/analytics/StepsShareCard";
import useStepsChartImage from "@/features/activities/analytics/useStepsChartImage";
import { StepRecord } from "@/database/activities/get-steps";
import { useTranslation } from "react-i18next";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { getTheme } from "@/lib/share/themes";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareModalShell from "@/lib/components/share/ShareModalShell";

type StepsShareModalProps = {
  visible: boolean;
  onClose: () => void;
  range: "week" | "month" | "3months";
  data: StepRecord[];
  todaySteps: number;
};

export default function StepsShareModal({
  visible,
  onClose,
  range,
  data,
  todaySteps,
}: StepsShareModalProps) {
  const { t, i18n } = useTranslation("activities");
  const locale = i18n.language;
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { theme: themeId } = useShareCardPreferences();
  const theme = getTheme(themeId);
  const chartHtml = useStepsChartImage(range, data, todaySteps, locale, theme);

  useEffect(() => {
    if (!visible) {
      setChartImageUri(null);
    }
  }, [visible, range]);

  useEffect(() => {
    setChartImageUri(null);
  }, [themeId]);

  const onWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    const dataUrl = event.nativeEvent.data;
    if (dataUrl && dataUrl.startsWith("data:image/png")) {
      setChartImageUri(dataUrl);
    }
  }, []);

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="steps-"
      labels={{
        save: t("activities.stepsShare.save"),
        saving: t("activities.stepsShare.saving"),
        share: t("activities.stepsShare.share"),
        sharing: t("activities.stepsShare.sharing"),
        close: t("activities.stepsShare.close"),
        saveSuccess: t("activities.stepsShare.saveSuccess"),
        saveError: t("activities.stepsShare.saveError"),
        shareError: t("activities.stepsShare.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme: cardTheme, size }) => (
        <StepsShareCard
          ref={cardRef}
          range={range}
          data={data}
          todaySteps={todaySteps}
          chartImageUri={chartImageUri}
          theme={cardTheme}
          size={size}
        />
      )}
      outsideContent={
        visible && !chartImageUri ? (
          <View
            className="absolute"
            style={{ width: 1, height: 1, opacity: 0 }}
            pointerEvents="none"
          >
            <WebView
              source={{ html: chartHtml }}
              onMessage={onWebViewMessage}
              javaScriptEnabled
              originWhitelist={["*"]}
              style={{ width: 960, height: 620 }}
            />
          </View>
        ) : null
      }
    />
  );
}
