import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Modal, LayoutChangeEvent } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ReportShareCard from "@/features/reports/components/ReportShareCard";
import useShareCard from "@/lib/hooks/useShareCard";
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
  const [shareCardScale, setShareCardScale] = useState(0.3);
  const { cardRef, isSharing, isSaving, shareCard, saveCardToGallery } =
    useShareCard("report-");

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await shareCard();
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
        className="flex-1 bg-black/80 justify-center items-center px-5"
        onLayout={onLayout}
      >
        <View className="w-full items-center">
          <View style={containerStyle}>
            <View style={transformStyle}>
              <ReportShareCard
                ref={cardRef}
                title={title}
                periodStart={periodStart}
                periodEnd={periodEnd}
                reportData={reportData}
                selectedFeatures={Array.from(selectedFeatures)}
              />
            </View>
          </View>

          {/* Feature Toggle Chips */}
          {availableFeatures.length > 1 && (
            <View className="w-full mt-4">
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

          <View className="mt-6 w-full gap-3">
            <View className="flex-row gap-3">
              <AnimatedButton
                onPress={async () => {
                  const success = await saveCardToGallery();
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
        </View>
      </View>
      <ToastMessage config={toastConfig} position="top" />
    </Modal>
  );
}
