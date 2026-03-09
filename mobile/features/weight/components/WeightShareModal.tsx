import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [chartImageUri, setChartImageUri] = useState<string | null>(null);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("weight-");

  const {
    theme: themeId,
    size,
    setTheme,
    setSize,
  } = useShareCardPreferences();

  const insets = useSafeAreaInsets();
  const theme = getTheme(themeId);
  const dims = SHARE_CARD_DIMENSIONS[size];

  const previewAreaHeight = useMemo(
    () => containerHeight * 0.4,
    [containerHeight],
  );

  const shareCardScale = useMemo(() => {
    if (containerWidth === 0 || previewAreaHeight === 0) return 0.3;
    const scaleX = (containerWidth - 40) / dims.width;
    const scaleY = previewAreaHeight / dims.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, previewAreaHeight, dims]);

  const chartHtml = useChartImage(range, data, locale, theme);

  // Reset chart image when modal closes, range changes, or theme changes
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

  const containerStyle = useMemo(
    () => ({
      width: dims.width * shareCardScale,
      height: dims.height * shareCardScale,
      overflow: "hidden" as const,
    }),
    [dims, shareCardScale],
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
                <WeightShareCard
                  ref={cardRef}
                  range={range}
                  data={data}
                  weightUnit={weightUnit}
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
                    ? t("weight.share.saveSuccess")
                    : t("common:common.error"),
                  text2: success
                    ? undefined
                    : t("weight.share.saveError"),
                  topOffset: 60,
                });
              }}
              className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
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
              className="flex-1 btn-base flex-row items-center justify-center gap-2"
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
        </>}
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
            style={{ width: 960, height: 620 }}
          />
        </View>
      )}

      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
