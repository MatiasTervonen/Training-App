import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, ScrollView, LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ReportShareCard from "@/features/reports/components/ReportShareCard";
import useShareCard from "@/lib/hooks/useShareCard";
import ShareCardPicker from "@/lib/components/share/ShareCardPicker";
import useShareCardPreferences from "@/lib/hooks/useShareCardPreferences";
import { getTheme, SHARE_CARD_DIMENSIONS } from "@/lib/share/themes";
import { Download, Share2 } from "lucide-react-native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import ToastMessage from "react-native-toast-message";
import { toastConfig } from "@/lib/config/toast";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { ReportFeature, ReportData } from "@/types/report";

type ReportShareModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  periodStart: string;
  periodEnd: string;
  reportData: ReportData;
  includedFeatures: ReportFeature[];
};

export default function ReportShareModal({
  visible,
  onClose,
  title,
  periodStart,
  periodEnd,
  reportData,
  includedFeatures,
}: ReportShareModalProps) {
  const { t } = useTranslation("reports");
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("report-");

  const {
    theme: themeId,
    size,
    setTheme,
    setSize,
  } = useShareCardPreferences();

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const dims = useMemo(() => SHARE_CARD_DIMENSIONS[size], [size]);

  // Only features that have data in the report
  const availableFeatures = useMemo(
    () => includedFeatures.filter((f) => reportData[f]),
    [includedFeatures, reportData],
  );

  const [selectedFeatures, setSelectedFeatures] = useState<Set<ReportFeature>>(
    () => new Set(availableFeatures),
  );

  useEffect(() => {
    if (visible) {
      setSelectedFeatures(new Set(availableFeatures));
    }
  }, [visible, availableFeatures]);

  const handleToggleFeature = useCallback(
    (feature: ReportFeature) => {
      setSelectedFeatures((prev) => {
        const next = new Set(prev);
        if (next.has(feature)) {
          if (next.size <= 1) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
              type: "info",
              text1: t("reports.share.minFeature"),
            });
            return prev;
          }
          next.delete(feature);
        } else {
          next.add(feature);
        }
        return next;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [t],
  );

  const insets = useSafeAreaInsets();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard(size);
    if (!success) {
      onClose();
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("reports.share.shareError"),
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
        className="flex-1 bg-black/95 px-5"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        onLayout={onLayout}
      >
        {containerHeight === 0 ? null : <>
        {/* Card preview — fixed height */}
        <View
          className="items-center justify-center"
          style={{ height: previewAreaHeight }}
        >
          <View style={containerStyle}>
            <View style={transformStyle}>
              <ReportShareCard
                ref={cardRef}
                title={title}
                periodStart={periodStart}
                periodEnd={periodEnd}
                reportData={reportData}
                selectedFeatures={Array.from(selectedFeatures)}
                theme={theme}
                size={size}
              />
            </View>
          </View>
        </View>

        {/* Middle content — toggles + picker */}
        <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
          {/* Feature Toggle Chips */}
          {availableFeatures.length > 1 && (
            <View className="w-full">
              <AppText className="text-sm text-gray-400 mb-2">
                {t("reports.share.showOnCard")}
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {availableFeatures.map((feature) => {
                  const isSelected = selectedFeatures.has(feature);
                  return (
                    <AnimatedButton
                      key={feature}
                      onPress={() => handleToggleFeature(feature)}
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-blue-700 border-blue-500"
                          : "bg-transparent border-gray-500"
                      }`}
                    >
                      <AppText
                        className={`text-sm ${isSelected ? "text-gray-100" : "text-gray-400"}`}
                      >
                        {t(`reports.features.${feature}`)}
                      </AppText>
                    </AnimatedButton>
                  );
                })}
              </View>
            </View>
          )}

          {/* Size & Theme Picker */}
          <View className="w-full mt-4">
            <ShareCardPicker
              selectedSize={size}
              onSizeChange={setSize}
              selectedTheme={themeId}
              onThemeChange={setTheme}
            />
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View className="w-full gap-3 pt-4">
          <View className="flex-row gap-3">
            <AnimatedButton
              onPress={async () => {
                const success = await saveCardToGallery(size);
                Toast.show({
                  type: success ? "success" : "error",
                  text1: success
                    ? t("activities:activities.share.saveSuccess")
                    : t("common:common.error"),
                  text2: success
                    ? undefined
                    : t("activities:activities.share.saveError"),
                  topOffset: 60,
                });
              }}
              className="flex-1 btn-neutral flex-row items-center justify-center gap-2"
              disabled={isSaving || isSharing}
            >
              <Download color="#f3f4f6" size={18} />
              <AppText className="text-base text-center" numberOfLines={1}>
                {isSaving
                  ? t("activities:activities.share.saving")
                  : t("activities:activities.share.save")}
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
                  ? t("reports.share.sharing")
                  : t("reports.share.share")}
              </AppText>
            </AnimatedButton>
          </View>
          <AnimatedButton
            onPress={onClose}
            className="btn-neutral items-center justify-center"
          >
            <AppText className="text-base text-center">
              {t("reports.share.close")}
            </AppText>
          </AnimatedButton>
        </View>
        </>}
      </View>
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
