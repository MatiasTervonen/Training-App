import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import WeightShareCard from "@/features/weight/components/WeightShareCard";
import useChartImage from "@/features/weight/components/useChartImage";
import useShareCard from "@/lib/hooks/useShareCard";
import { weight } from "@/types/session";
import { Download, Share2 } from "lucide-react-native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import ToastMessage from "react-native-toast-message";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import WebView, { WebViewMessageEvent } from "react-native-webview";

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
  const [shareCardScale, setShareCardScale] = useState(0.3);
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("weight-");

  const chartHtml = useChartImage(range, data, locale);

  // Reset chart image when modal closes or range changes
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
        text2: t("weight.share.shareError"),
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
              <WeightShareCard
                ref={cardRef}
                range={range}
                data={data}
                weightUnit={weightUnit}
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
                      ? t("weight.share.saveSuccess")
                      : t("common:common.error"),
                    text2: success
                      ? undefined
                      : t("weight.share.saveError"),
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
                    ? t("weight.share.saving")
                    : t("weight.share.save")}
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
                    ? t("weight.share.sharing")
                    : t("weight.share.share")}
                </AppText>
              </AnimatedButton>
            </View>
            <AnimatedButton
              onPress={onClose}
              className="btn-neutral items-center justify-center"
            >
              <AppText className="text-base text-center">
                {t("weight.share.close")}
              </AppText>
            </AnimatedButton>
          </View>
        </View>
      </View>

      {/* Hidden WebView renders chart with canvas, exports PNG data URL */}
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
            style={{ width: 960, height: 540 }}
          />
        </View>
      )}

      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
