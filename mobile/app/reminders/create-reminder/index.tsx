import { useState, useEffect } from "react";
import {
  View,
  Pressable,
  Keyboard,
  AppState,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import PageContainer from "@/components/PageContainer";
import DatePicker from "react-native-date-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, Info } from "lucide-react-native";
import { formatDateTime, formatTime } from "@/lib/formatDate";
import { Checkbox } from "expo-checkbox";
import Toggle from "@/components/toggle";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import useSaveReminder from "@/features/reminders/hooks/global/useSaveReminder";
import useSaveReminderOnetime from "@/features/reminders/hooks/onetime/useSaveReminder";
import useSaveReminderDaily from "@/features/reminders/hooks/daily/useSaveReminderDaily";
import useSaveReminderWeekly from "@/features/reminders/hooks/weekly/useSaveReminder";
import useSetNotificationGlobal from "@/features/reminders/hooks/global/useSetNotification";
import useSetNotificationOnetime from "@/features/reminders/hooks/onetime/useSetNotification";
import useSetNotificationDaily from "@/features/reminders/hooks/daily/useSetNotification";
import useSetNotificationWeekly from "@/features/reminders/hooks/weekly/useSetNotification";

type ReminderType = "one-time" | "daily" | "weekly" | "global";

const DRAFT_KEY = "create_reminder_draft";

const TYPES: { key: ReminderType; labelKey: string }[] = [
  { key: "one-time", labelKey: "reminders.type.onetime" },
  { key: "daily", labelKey: "reminders.type.daily" },
  { key: "weekly", labelKey: "reminders.type.weekly" },
  { key: "global", labelKey: "reminders.type.global" },
];

export default function CreateReminderScreen() {
  const { t, i18n } = useTranslation("reminders");
  const [selectedType, setSelectedType] = useState<ReminderType>("one-time");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyAt, setNotifyAt] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [mode, setMode] = useState<"alarm" | "normal">("normal");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  const usesDatetime = selectedType === "one-time" || selectedType === "global";

  const formattedTime = notifyAt
    ? usesDatetime
      ? formatDateTime(notifyAt)
      : formatTime(notifyAt)
    : null;

  // Draft: load on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_KEY);
        if (stored) {
          const draft = JSON.parse(stored);
          if (draft.type) setSelectedType(draft.type);
          if (draft.title) setTitle(draft.title);
          if (draft.notes) setNotes(draft.notes);
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, []);

  // Draft: auto-save
  const saveDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;
      if (title.trim().length === 0 && notes.trim().length === 0) {
        await AsyncStorage.removeItem(DRAFT_KEY);
      } else {
        await AsyncStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ type: selectedType, title, notes }),
        );
      }
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    saveDraft();
  }, [title, notes, selectedType, saveDraft]);

  const resetReminder = () => {
    AsyncStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setNotes("");
    setNotifyAt(null);
    setWeekdays([]);
    setMode("normal");
  };

  // Exact alarm permission
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const allowed = await canUseExactAlarm();
      if (allowed) {
        setShowModal(false);
        setMode("alarm");
      }
    });
    return () => sub.remove();
  }, []);

  // Notification hooks (all called unconditionally per Rules of Hooks)
  const { setNotification: setNotificationGlobal } =
    useSetNotificationGlobal({
      notifyAt: notifyAt!,
      title,
      notes,
      mode,
    });

  const { setNotification: setNotificationOnetime } =
    useSetNotificationOnetime({
      notifyAt: notifyAt!,
      title,
      notes,
      mode,
    });

  const { setNotification: setNotificationDaily } = useSetNotificationDaily({
    notifyAt: notifyAt!,
    title,
    notes,
    mode,
  });

  const { setNotification: setNotificationWeekly } =
    useSetNotificationWeekly({
      notifyAt: notifyAt!,
      title,
      notes,
      weekdays,
      mode,
    });

  // Save hooks (all called unconditionally)
  const { saveReminder: saveGlobal } = useSaveReminder({
    title,
    notes,
    notifyAt: notifyAt!,
    mode,
    setIsSaving,
    resetReminder,
    setNotification: setNotificationGlobal,
  });

  const { saveReminder: saveOnetime } = useSaveReminderOnetime({
    title,
    notes,
    notifyAt: notifyAt!,
    mode,
    setIsSaving,
    resetReminder,
    setNotification: setNotificationOnetime,
  });

  const { saveReminder: saveDaily } = useSaveReminderDaily({
    title,
    notes,
    notifyAt: notifyAt!,
    mode,
    setIsSaving,
    setNotification: setNotificationDaily,
    resetReminder,
  });

  const { saveReminder: saveWeekly } = useSaveReminderWeekly({
    title,
    notes,
    notifyAt: notifyAt!,
    weekdays,
    mode,
    setIsSaving,
    setNotification: setNotificationWeekly,
    resetReminder,
  });

  const handleSave = () => {
    switch (selectedType) {
      case "global":
        return saveGlobal();
      case "one-time":
        return saveOnetime();
      case "daily":
        return saveDaily();
      case "weekly":
        return saveWeekly();
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <PageContainer>
            <View className="justify-between flex-1">
            <View className="gap-5">
            {/* Type selector — 2x2 grid */}
            <View className="bg-slate-800 rounded-lg mb-6 p-1 gap-1">
              <View className="flex-row gap-1">
                {TYPES.slice(0, 2).map(({ key, labelKey }) => {
                  const isActive = selectedType === key;
                  return (
                    <AnimatedButton
                      key={key}
                      onPress={() => setSelectedType(key)}
                      className={`flex-1 py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
                    >
                      <AppTextNC
                        className={`text-center font-medium ${
                          isActive ? "text-cyan-400" : "text-gray-200"
                        }`}
                      >
                        {t(labelKey)}
                      </AppTextNC>
                    </AnimatedButton>
                  );
                })}
              </View>
              <View className="flex-row gap-1">
                {TYPES.slice(2).map(({ key, labelKey }) => {
                  const isActive = selectedType === key;
                  return (
                    <AnimatedButton
                      key={key}
                      onPress={() => setSelectedType(key)}
                      className={`flex-1 py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
                    >
                      <AppTextNC
                        className={`text-center font-medium ${
                          isActive ? "text-cyan-400" : "text-gray-200"
                        }`}
                      >
                        {t(labelKey)}
                      </AppTextNC>
                    </AnimatedButton>
                  );
                })}
              </View>
            </View>

            {/* Global info banner */}
            {selectedType === "global" && (
              <View className="flex-row items-center mb-4">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.globalInfo")}
                </AppText>
              </View>
            )}

            {/* One-time info banner */}
            {selectedType === "one-time" && (
              <View className="flex-row items-center mb-4">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.oneTimeInfo")}
                </AppText>
              </View>
            )}

            {/* Daily info banner */}
            {selectedType === "daily" && (
              <View className="flex-row items-center mb-4">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.dailyInfo")}
                </AppText>
              </View>
            )}

            {/* Weekly info banner */}
            {selectedType === "weekly" && (
              <View className="flex-row items-center mb-4">
                <Info color="#9ca3af" size={18} />
                <AppText className="text-gray-400 text-sm ml-2">
                  {t("reminders.weeklyInfo")}
                </AppText>
              </View>
            )}

            <View className="gap-5">
              {/* Title */}
              <View>
                <AppInput
                  value={title}
                  setValue={setTitle}
                  placeholder={t("reminders.titlePlaceholder")}
                  label={t("reminders.titleLabel")}
                />
              </View>

              {/* Notes */}
              <SubNotesInput
                value={notes}
                setValue={setNotes}
                placeholder={t("reminders.notesPlaceholder")}
                label={t("reminders.notesLabel")}
              />

              {/* DateTime/Time picker */}
              <View>
                <AnimatedButton
                  label={formattedTime ?? t("reminders.setNotifyTime")}
                  onPress={() => setOpen(true)}
                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 flex-row gap-2 justify-center items-center"
                  textClassName="text-gray-100"
                >
                  <Plus color="#f3f4f6" />
                </AnimatedButton>
              </View>
              <DatePicker
                date={notifyAt || new Date()}
                onDateChange={setNotifyAt}
                mode={usesDatetime ? "datetime" : "time"}
                modal
                minimumDate={usesDatetime ? new Date() : undefined}
                open={open}
                locale={i18n.language}
                title={
                  usesDatetime
                    ? t("common:datePicker.selectDateTime")
                    : t("common:datePicker.selectTime")
                }
                confirmText={t("common:datePicker.confirm")}
                cancelText={t("common:datePicker.cancel")}
                onConfirm={(date) => {
                  setOpen(false);
                  setNotifyAt(date);
                }}
                onCancel={() => setOpen(false)}
              />

              {/* Weekday checkboxes (weekly only) */}
              {selectedType === "weekly" && (
                <View className="mt-2">
                  <AppText>{t("reminders.repeatOnDays")}</AppText>
                  <View className="flex-row justify-between mt-3 px-4">
                    {days.map((day, index) => {
                      const dayNumber = index + 1;
                      const isChecked = weekdays.includes(dayNumber);
                      return (
                        <View key={day} className="items-center mt-2">
                          <Checkbox
                            hitSlop={10}
                            value={isChecked}
                            onValueChange={(newValue) => {
                              if (newValue) {
                                setWeekdays((prev) => [...prev, dayNumber]);
                              } else {
                                setWeekdays((prev) =>
                                  prev.filter((d) => d !== dayNumber),
                                );
                              }
                            }}
                          />
                          <AppText className="mt-2">{day}</AppText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* High priority toggle */}
              <View className="flex-row items-center justify-between px-4 mt-5">
                <View>
                  <AppText>{t("reminders.enableHighPriority")}</AppText>
                  <AppText className="text-gray-400 text-sm">
                    {t("reminders.highPriorityDescription")}
                  </AppText>
                </View>
                <Toggle
                  isOn={mode === "alarm"}
                  onToggle={async () => {
                    const allowed = await canUseExactAlarm();
                    if (!allowed) {
                      setShowModal(true);
                      return;
                    }
                    setMode(mode === "alarm" ? "normal" : "alarm");
                  }}
                />
              </View>
            </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <DeleteButton onPress={resetReminder} />
              </View>
              <View className="flex-1">
                <SaveButton onPress={handleSave} />
              </View>
            </View>
          </View>

          <FullScreenLoader
            visible={isSaving}
            message={t("reminders.savingReminder")}
          />
          </PageContainer>
        </Pressable>
      </ScrollView>

      <InfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={t("reminders.alarmPermission.title")}
        description={t("reminders.alarmPermission.description")}
        cancelLabel={t("reminders.alarmPermission.cancel")}
        confirmLabel={t("reminders.alarmPermission.allow")}
        onConfirm={async () => {
          await requestExactAlarm();
          setShowModal(false);
        }}
      />
    </>
  );
}
