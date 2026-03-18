import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import WeightShareCard from "@/features/weight/components/WeightShareCard";
import useChartImage from "@/features/weight/components/useChartImage";
import { weight } from "@/types/session";
import { useTranslation } from "react-i18next";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { getTheme } from "@/lib/share/themes";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import ShareModalShell from "@/lib/components/share/ShareModalShell";

type WeightShareModalProps = {
  visible: boolean;
  onClose: () => void;
  range: "week" | "month" | "year";
  data: weight[];
  weightUnit: string;
};

export default function WeightShareModal({
  visible,
  onClose,
  range,
  data,
  weightUnit,
}: WeightShareModalProps) {
  const { t, i18n } = useTranslation("weight");
  const locale = i18n.language;
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { theme: themeId } = useShareCardPreferences();
  const theme = getTheme(themeId);
  const chartHtml = useChartImage(range, data, locale, theme);

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
      prefix="weight-"
      labels={{
        save: t("weight.share.save"),
        saving: t("weight.share.saving"),
        share: t("weight.share.share"),
        sharing: t("weight.share.sharing"),
        close: t("weight.share.close"),
        saveSuccess: t("weight.share.saveSuccess"),
        saveError: t("weight.share.saveError"),
        shareError: t("weight.share.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme: cardTheme, size }) => (
        <WeightShareCard
          ref={cardRef}
          range={range}
          data={data}
          weightUnit={weightUnit}
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
