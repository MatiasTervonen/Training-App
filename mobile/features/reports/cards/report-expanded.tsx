import { useState } from "react";
import { View, ScrollView, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import AppText from "@/components/AppText";
import ErrorMessage from "@/components/ErrorMessage";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import ReportSection from "@/features/reports/components/ReportSection";
import ReportShareModal from "@/features/reports/components/ReportShareModal";
import useGeneratedReport from "@/features/reports/hooks/useGeneratedReport";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import { FeedItemUI } from "@/types/session";
import { ReportFeature } from "@/types/report";
import { formatDateShort } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { Share2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

type ReportPayload = {
  period_start: string;
  period_end: string;
  included_features: ReportFeature[];
  schedule_id: string;
};

type ReportSessionProps = {
  item: FeedItemUI;
};

export default function ReportSession({ item }: ReportSessionProps) {
  const { t } = useTranslation("reports");
  const [shareVisible, setShareVisible] = useState(false);
  const modalScroll = useFullScreenModalScroll();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };

  const payload = item.extra_fields as ReportPayload;

  const {
    data: report,
    isLoading,
    error,
  } = useGeneratedReport(item.source_id);

  if (isLoading) {
    return (
      <View className="gap-2 justify-center items-center pt-40">
        <AppText className="text-lg">{t("feed:feed.loadingReport")}</AppText>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !report) {
    return (
      <ErrorMessage message={t("feed:feed.reportError")} fullPage />
    );
  }

  const dateRange = `${formatDateShort(report.period_start)} – ${formatDateShort(report.period_end)}`;

  return (
    <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
      <PageContainer className="mb-10">
        <AppText className="text-gray-400 text-center mb-2 text-sm">
          {dateRange}
        </AppText>
        <LinearGradient
          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5 gap-4"
        >
          <View className="w-full flex-row items-center">
            <View className="w-5" />
            <AppText className="text-2xl text-center flex-1">
              {report.title}
            </AppText>
            <AnimatedButton
              onPress={() => setShareVisible(true)}
              hitSlop={10}
            >
              <Share2 color="#9ca3af" size={20} />
            </AnimatedButton>
          </View>
        </LinearGradient>

        <View className="gap-4 mt-6 pb-10">
          {payload.included_features.map((feature) => (
            <ReportSection
              key={feature}
              feature={feature}
              data={report.report_data}
            />
          ))}
        </View>
      </PageContainer>

      <ReportShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        title={report.title}
        periodStart={report.period_start}
        periodEnd={report.period_end}
        reportData={report.report_data}
        includedFeatures={payload.included_features}
      />
    </ScrollView>
  );
}
