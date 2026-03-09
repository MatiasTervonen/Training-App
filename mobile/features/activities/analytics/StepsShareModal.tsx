import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import StepsShareCard from "@/features/activities/analytics/StepsShareCard";
import useStepsChartImage from "@/features/activities/analytics/useStepsChartImage";
import useShareCard from "@/lib/hooks/useShareCard";
import { StepRecord } from "@/database/activities/get-steps";
import { Download, Share2 } from "lucide-react-native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import ToastMessage from "react-native-toast-message";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("steps-");

  const { theme: themeId, size, setTheme, setSize } = useShareCardPreferences();
  const insets = useSafeAreaInsets();
  const theme = getTheme(themeId);
  const dims = SHARE_CARD_DIMENSIONS[size];

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

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const shareCardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims.width, dims.height]);

  const containerStyle = useMemo(
    () => ({
      width: dims.width * shareCardScale,
      height: dims.height * shareCardScale,
      overflow: "hidden" as const,
    }),
    [shareCardScale, dims.width, dims.height],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const handleShare = async () => {
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("activities.stepsShare.shareError"),
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/95 px-5 justify-between"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        onLayout={onLayout}
      >
        {containerHeight === 0 ? null : <>
        {/* Top section: preview + picker */}
        <View>
          <View
            className="items-center justify-center"
            style={{ height: previewAreaHeight }}
          >
            <View style={containerStyle}>
              <View style={transformStyle}>
                <StepsShareCard
                  ref={cardRef}
                  range={range}
                  data={data}
                  todaySteps={todaySteps}
                  chartImageUri={chartImageUri}
                  theme={theme}
                  size={size}
                />
              </View>
            </View>
          </View>

          <View className="mt-4">
            <ShareCardPicker
              selectedSize={size}
              onSizeChange={setSize}
              selectedTheme={themeId}
              onThemeChange={setTheme}
            />
          </View>
        </View>

        {/* Bottom buttons */}
        <View className="w-full gap-3">
          <View className="flex-row gap-3">
            <AnimatedButton
              onPress={async () => {
                const success = await saveCardToGallery(size);
                Toast.show({
                  type: success ? "success" : "error",
                  text1: success
                    ? t("activities.stepsShare.saveSuccess")
                    : t("common:common.error"),
                  text2: success
                    ? undefined
                    : t("activities.stepsShare.saveError"),
                  topOffset: 60,
                });
              }}
              className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
              disabled={isSaving || isSharing}
            >
              <Download color="#f3f4f6" size={18} />
              <AppText className="text-base text-center" numberOfLines={1}>
                {isSaving
                  ? t("activities.stepsShare.saving")
                  : t("activities.stepsShare.save")}
              </AppText>
            </AnimatedButton>
            <AnimatedButton
              onPress={handleShare}
              className="flex-1 btn-base flex-row items-center justify-center gap-2"
              disabled={isSharing || isSaving}
            >
              <Share2 color="#f3f4f6" size={18} />
              <AppText className="text-base text-center" numberOfLines={1}>
                {isSharing
                  ? t("activities.stepsShare.sharing")
                  : t("activities.stepsShare.share")}
              </AppText>
            </AnimatedButton>
          </View>
          <AnimatedButton
            onPress={onClose}
            className="btn-neutral items-center justify-center"
          >
            <AppText className="text-base text-center">
              {t("activities.stepsShare.close")}
            </AppText>
          </AnimatedButton>
        </View>
        </>}
      </View>

      {visible && !chartImageUri && (
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
      )}

      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
