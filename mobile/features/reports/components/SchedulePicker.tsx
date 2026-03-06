import { View } from "react-native";
import SelectInput from "@/components/Selectinput";
import { useTranslation } from "react-i18next";
import { SCHEDULE_TYPES, ScheduleType } from "@/types/report";

type SchedulePickerProps = {
  scheduleType: ScheduleType;
  onScheduleTypeChange: (type: ScheduleType) => void;
  deliveryDayOfWeek: number;
  onDeliveryDayOfWeekChange: (day: number) => void;
  deliveryDayOfMonth: number;
  onDeliveryDayOfMonthChange: (day: number) => void;
  deliveryHour: number;
  onDeliveryHourChange: (hour: number) => void;
};

export default function SchedulePicker({
  scheduleType,
  onScheduleTypeChange,
  deliveryDayOfWeek,
  onDeliveryDayOfWeekChange,
  deliveryDayOfMonth,
  onDeliveryDayOfMonthChange,
  deliveryHour,
  onDeliveryHourChange,
}: SchedulePickerProps) {
  const { t } = useTranslation("reports");

  const scheduleOptions = SCHEDULE_TYPES.map((s) => ({
    value: s.key,
    label: t(s.labelKey),
  }));

  const weekdayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: String(i),
    label: t(`reports.weekdays.${i}`),
  }));

  const dayOfMonthOptions = Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: t("reports.dayOfMonth", { day: i + 1 }),
  }));

  const hourOptions = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return {
      value: String(hour),
      label: new Date(2000, 0, 1, hour).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  const isWeekly = scheduleType === "weekly" || scheduleType === "biweekly";

  return (
    <View className="gap-4">
      <SelectInput
        topLabel={t("reports.schedule")}
        label={t("reports.schedule")}
        options={scheduleOptions}
        value={scheduleType}
        onChange={(val) => onScheduleTypeChange(val as ScheduleType)}
      />

      {isWeekly ? (
        <SelectInput
          topLabel={t("reports.deliverOn")}
          label={t("reports.deliverOn")}
          options={weekdayOptions}
          value={String(deliveryDayOfWeek)}
          onChange={(val) => onDeliveryDayOfWeekChange(Number(val))}
        />
      ) : (
        <SelectInput
          topLabel={t("reports.deliverOn")}
          label={t("reports.deliverOn")}
          options={dayOfMonthOptions}
          value={String(deliveryDayOfMonth)}
          onChange={(val) => onDeliveryDayOfMonthChange(Number(val))}
        />
      )}

      <SelectInput
        topLabel={t("reports.deliveryTime")}
        label={t("reports.deliveryTime")}
        options={hourOptions}
        value={String(deliveryHour)}
        onChange={(val) => onDeliveryHourChange(Number(val))}
      />
    </View>
  );
}
