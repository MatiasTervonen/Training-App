import { View } from "react-native";
import AppText from "@/components/AppText";
import EditButton from "@/components/buttons/EditButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import { useTranslation } from "react-i18next";
import { ReportSchedule, SCHEDULE_TYPES } from "@/types/report";
import AppTextNC from "@/components/AppTextNC";

type ReportScheduleCardProps = {
  schedule: ReportSchedule;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ReportScheduleCard({
  schedule,
  onEdit,
  onDelete,
}: ReportScheduleCardProps) {
  const { t } = useTranslation("reports");

  const scheduleLabel =
    SCHEDULE_TYPES.find((s) => s.key === schedule.schedule_type)?.labelKey ?? "";

  const isWeekly =
    schedule.schedule_type === "weekly" ||
    schedule.schedule_type === "biweekly";

  const deliveryDay = isWeekly
    ? t(`reports.weekdays.${schedule.delivery_day_of_week}`)
    : t("reports.dayOfMonth", { day: schedule.delivery_day_of_month });

  const deliveryTime = new Date(2000, 0, 1, schedule.delivery_hour).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const featureLabels = schedule.included_features
    .map((f) => t(`reports.features.${f}`))
    .join(", ");

  return (
    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <AppText className="text-lg mb-1">
        {schedule.title}
      </AppText>
      <AppTextNC className="text-sm text-gray-400 mb-1">
        {t(scheduleLabel)} · {deliveryDay} · {deliveryTime}
      </AppTextNC>
      <AppTextNC className="text-sm text-gray-400 mb-3">
        {featureLabels}
      </AppTextNC>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <EditButton onPress={onEdit} label={t("reports.editReport")} />
        </View>
        <View className="flex-1">
          <DeleteButton
            onPress={onDelete}
            label={t("reports.delete")}
            confirm
          />
        </View>
      </View>
    </View>
  );
}
