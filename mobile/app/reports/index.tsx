import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import ReportScheduleCard from "@/features/reports/components/ReportScheduleCard";
import useReportSchedules from "@/features/reports/hooks/useReportSchedules";
import useDeleteReportSchedule from "@/features/reports/hooks/useDeleteReportSchedule";
import { MAX_REPORTS } from "@/types/report";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Plus } from "lucide-react-native";

export default function ReportsScreen() {
  const { t } = useTranslation("reports");
  const router = useRouter();
  const { data: schedules = [] } = useReportSchedules();
  const deleteMutation = useDeleteReportSchedule();

  const atLimit = schedules.length >= MAX_REPORTS;

  const handleDelete = async (scheduleId: string) => {
    try {
      await deleteMutation.mutateAsync(scheduleId);
      Toast.show({ type: "success", text1: t("reports.deleted") });
    } catch {
      Toast.show({ type: "error", text1: t("reports.errorDeleting") });
    }
  };

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-6">
        {t("reports.title")}
      </AppText>

      <AppText className="text-sm text-gray-400 mb-4">
        {t("reports.yourReports")} ({schedules.length}/{MAX_REPORTS})
      </AppText>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {schedules.length === 0 ? (
          <View className="items-center py-10">
            <AppText className="text-gray-400 text-center">
              {t("reports.noReports")}
            </AppText>
            <AppText className="text-gray-500 text-sm text-center mt-2">
              {t("reports.createFirst")}
            </AppText>
          </View>
        ) : (
          <View className="gap-3">
            {schedules.map((schedule) => (
              <ReportScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={() =>
                  router.push(`/reports/create?id=${schedule.id}`)
                }
                onDelete={() => handleDelete(schedule.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View className="gap-3 pt-4">
        <AnimatedButton
          onPress={() => router.push("/reports/create")}
          className={`${atLimit ? "btn-disabled" : "btn-base"} flex-row items-center justify-center gap-2`}
          disabled={atLimit}
        >
          <Plus size={18} color="#f3f4f6" />
          <AppText className="text-base text-center text-gray-100">
            {atLimit ? t("reports.maxReached") : t("reports.createReport")}
          </AppText>
        </AnimatedButton>

        {!atLimit && (
          <View>
            <AppText className="text-sm text-gray-500 mb-2">
              {t("reports.quickAdd")}
            </AppText>
            <View className="flex-row gap-3">
              <AnimatedButton
                onPress={() =>
                  router.push("/reports/create?preset=weekly")
                }
                className="flex-1 btn-neutral items-center justify-center"
              >
                <AppText className="text-sm text-center text-gray-200">
                  {t("reports.presets.weekly")}
                </AppText>
              </AnimatedButton>
              <AnimatedButton
                onPress={() =>
                  router.push("/reports/create?preset=monthly")
                }
                className="flex-1 btn-neutral items-center justify-center"
              >
                <AppText className="text-sm text-center text-gray-200">
                  {t("reports.presets.monthly")}
                </AppText>
              </AnimatedButton>
            </View>
          </View>
        )}
      </View>
    </PageContainer>
  );
}
