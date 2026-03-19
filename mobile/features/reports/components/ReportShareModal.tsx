import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import ReportShareCard from "@/features/reports/components/ReportShareCard";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { ReportFeature, ReportData } from "@/types/report";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import ShareModalShell from "@/lib/components/share/ShareModalShell";
import AppTextNC from "@/components/AppTextNC";

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

  return (
    <ShareModalShell
      visible={visible}
      onClose={onClose}
      prefix="report-"
      labels={{
        save: t("activities:activities.share.save"),
        saving: t("activities:activities.share.saving"),
        share: t("reports.share.share"),
        sharing: t("reports.share.sharing"),
        close: t("reports.share.close"),
        saveSuccess: t("activities:activities.share.saveSuccess"),
        saveError: t("activities:activities.share.saveError"),
        shareError: t("reports.share.shareError"),
        error: t("common:common.error"),
      }}
      renderCard={({ cardRef, theme, size }) => (
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
      )}
      middleContent={() =>
        availableFeatures.length > 1 ? (
          <View className="w-full mt-4">
            <AppTextNC className="text-sm text-gray-400 mb-2">
              {t("reports.share.showOnCard")}
            </AppTextNC>
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
                    <AppTextNC
                      className={`text-sm ${isSelected ? "text-gray-100" : "text-gray-400"}`}
                    >
                      {t(`reports.features.${feature}`)}
                    </AppTextNC>
                  </AnimatedButton>
                );
              })}
            </View>
          </View>
        ) : null
      }
    />
  );
}
