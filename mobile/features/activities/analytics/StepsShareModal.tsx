import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
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
  const [shareCardScale, setShareCardScale] = useState(0.3);
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("steps-");

  const chartHtml = useStepsChartImage(range, data, todaySteps, locale);

  useEffect(() => {
    if (!visible) {
      setChartImageUri(null);
    }
  }, [visible, range]);

  const onWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    const dataUrl = event.nativeEvent.data;
    if (dataUrl && dataUrl.startsWith("data:image/png")) {
      setChartImageUri(dataUrl);
    }
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const containerWidth = e.nativeEvent.layout.width;
    const scale = (containerWidth - 40) / 1080;
    setShareCardScale(Math.min(scale, 0.4));
  }, []);

  const containerStyle = useMemo(
    () => ({
      width: 1080 * shareCardScale,
      height: 1080 * shareCardScale,
      overflow: "hidden" as const,
    }),
    [shareCardScale],
  );

  const transformStyle = useMemo(
    () => ({
      transform: [{ scale: shareCardScale }],
      transformOrigin: "top left" as const,
    }),
    [shareCardScale],
  );

  const handleShare = async () => {
    const success = await shareCard();
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
        className="flex-1 bg-black/80 justify-center items-center px-5"
        onLayout={onLayout}
      >
        <View className="w-full items-center">
          <View style={containerStyle}>
            <View style={transformStyle}>
              <StepsShareCard
                ref={cardRef}
                range={range}
                data={data}
                todaySteps={todaySteps}
                chartImageUri={chartImageUri}
              />
            </View>
          </View>

          <View className="mt-6 w-full gap-3">
            <View className="flex-row gap-3">
              <AnimatedButton
                onPress={async () => {
                  const success = await saveCardToGallery();
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
                tabClassName="flex-1"
                className="btn-neutral flex-row items-center justify-center gap-2"
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
                tabClassName="flex-1"
                className="btn-base flex-row items-center justify-center gap-2"
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
        </View>
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
