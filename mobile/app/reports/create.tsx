import { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import FeatureCheckbox from "@/features/reports/components/FeatureCheckbox";
import SchedulePicker from "@/features/reports/components/SchedulePicker";
import useReportSchedules from "@/features/reports/hooks/useReportSchedules";
import useSaveReportSchedule from "@/features/reports/hooks/useSaveReportSchedule";
import useUpdateReportSchedule from "@/features/reports/hooks/useUpdateReportSchedule";
import { useAutoSave } from "@/hooks/useAutoSave";
import { REPORT_FEATURES, ReportFeature, ScheduleType } from "@/types/report";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

export default function CreateReportScreen() {
  const { t } = useTranslation("reports");
  const router = useRouter();
  const { id, preset } = useLocalSearchParams<{
    id?: string;
    preset?: string;
  }>();
  const isEditing = !!id;

  const { data: schedules = [] } = useReportSchedules();
  const saveMutation = useSaveReportSchedule();
  const updateMutation = useUpdateReportSchedule();

  const [title, setTitle] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<Set<ReportFeature>>(
    new Set(),
  );
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekly");
  const [deliveryDayOfWeek, setDeliveryDayOfWeek] = useState(1); // Monday
  const [deliveryDayOfMonth, setDeliveryDayOfMonth] = useState(1);
  const [deliveryHour, setDeliveryHour] = useState(8);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill for editing
  useEffect(() => {
    if (isEditing) {
      const schedule = schedules.find((s) => s.id === id);
      if (schedule) {
        setTitle(schedule.title);
        setSelectedFeatures(new Set(schedule.included_features));
        setScheduleType(schedule.schedule_type);
        setDeliveryDayOfWeek(schedule.delivery_day_of_week ?? 1);
        setDeliveryDayOfMonth(schedule.delivery_day_of_month ?? 1);
        setDeliveryHour(schedule.delivery_hour);
      }
    }
  }, [isEditing, id, schedules]);

  // Pre-fill for preset
  useEffect(() => {
    if (preset && !isEditing) {
      const allFeatures = new Set<ReportFeature>(
        REPORT_FEATURES.map((f) => f.key),
      );
      setSelectedFeatures(allFeatures);

      if (preset === "weekly") {
        setTitle(t("reports.presets.weekly"));
        setScheduleType("weekly");
        setDeliveryDayOfWeek(1); // Monday
        setDeliveryHour(8);
      } else if (preset === "monthly") {
        setTitle(t("reports.presets.monthly"));
        setScheduleType("monthly");
        setDeliveryDayOfMonth(1);
        setDeliveryHour(8);
      }
    }
  }, [preset, isEditing, t]);

  const toggleFeature = (feature: ReportFeature) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) {
        next.delete(feature);
      } else {
        next.add(feature);
      }
      return next;
    });
  };

  // Auto-save (edit mode only)
  const autoSaveData = useMemo(
    () => ({
      title,
      selectedFeatures: Array.from(selectedFeatures).sort(),
      scheduleType,
      deliveryDayOfWeek,
      deliveryDayOfMonth,
      deliveryHour,
    }),
    [title, selectedFeatures, scheduleType, deliveryDayOfWeek, deliveryDayOfMonth, deliveryHour],
  );

  const handleAutoSave = useCallback(async () => {
    if (!title.trim()) throw new Error("Title required");
    if (selectedFeatures.size === 0) throw new Error("At least one feature required");

    const isWeekly =
      scheduleType === "weekly" || scheduleType === "biweekly";

    await updateMutation.mutateAsync({
      scheduleId: id!,
      title: title.trim(),
      includedFeatures: Array.from(selectedFeatures),
      scheduleType,
      deliveryDayOfWeek: isWeekly ? deliveryDayOfWeek : null,
      deliveryDayOfMonth: isWeekly ? null : deliveryDayOfMonth,
      deliveryHour,
    });
  }, [
    title, selectedFeatures, scheduleType, deliveryDayOfWeek,
    deliveryDayOfMonth, deliveryHour, id, updateMutation,
  ]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: isEditing,
  });

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({ type: "error", text1: t("reports.titleRequired") });
      return;
    }
    if (selectedFeatures.size === 0) {
      Toast.show({ type: "error", text1: t("reports.atLeastOneFeature") });
      return;
    }

    const isWeekly =
      scheduleType === "weekly" || scheduleType === "biweekly";

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          scheduleId: id!,
          title: title.trim(),
          includedFeatures: Array.from(selectedFeatures),
          scheduleType,
          deliveryDayOfWeek: isWeekly ? deliveryDayOfWeek : null,
          deliveryDayOfMonth: isWeekly ? null : deliveryDayOfMonth,
          deliveryHour,
        });
      } else {
        await saveMutation.mutateAsync({
          title: title.trim(),
          includedFeatures: Array.from(selectedFeatures),
          scheduleType,
          deliveryDayOfWeek: isWeekly ? deliveryDayOfWeek : null,
          deliveryDayOfMonth: isWeekly ? null : deliveryDayOfMonth,
          deliveryHour,
        });
      }
      Toast.show({ type: "success", text1: t("reports.saved") });
      router.back();
    } catch {
      setIsSaving(false);
      Toast.show({ type: "error", text1: t("reports.errorSaving") });
    }
  };

  const canSave = title.trim().length > 0 && selectedFeatures.size > 0;

  return (
    <>
      <AutoSaveIndicator status={status} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <PageContainer>
          <AppText className="text-2xl text-center mb-6">
            {isEditing ? t("reports.editReport") : t("reports.createReport")}
          </AppText>

          <View className="gap-8">
            <AppInput
              value={title}
              setValue={setTitle}
              label={t("reports.reportName")}
              placeholder={t("reports.reportNamePlaceholder")}
            />

            <View>
              <AppText className="text-sm text-gray-400 mb-2">
                {t("reports.include")}
              </AppText>
              <View className="gap-2">
                {REPORT_FEATURES.map((feature) => (
                  <FeatureCheckbox
                    key={feature.key}
                    featureKey={feature.key}
                    label={t(feature.labelKey)}
                    selected={selectedFeatures.has(feature.key)}
                    onToggle={() => toggleFeature(feature.key)}
                  />
                ))}
              </View>
            </View>

            <SchedulePicker
              scheduleType={scheduleType}
              onScheduleTypeChange={setScheduleType}
              deliveryDayOfWeek={deliveryDayOfWeek}
              onDeliveryDayOfWeekChange={setDeliveryDayOfWeek}
              deliveryDayOfMonth={deliveryDayOfMonth}
              onDeliveryDayOfMonthChange={setDeliveryDayOfMonth}
              deliveryHour={deliveryHour}
              onDeliveryHourChange={setDeliveryHour}
            />
          </View>

          {!isEditing && (
            <View className="pt-10">
              <SaveButton
                onPress={handleSave}
                label={t("reports.save")}
                disabled={!canSave}
              />
            </View>
          )}
        </PageContainer>
      </ScrollView>

      {!isEditing && (
        <FullScreenLoader
          visible={isSaving}
          message={t("common:common.saving")}
        />
      )}
    </>
  );
}
