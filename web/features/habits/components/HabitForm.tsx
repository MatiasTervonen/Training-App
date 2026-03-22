"use client";

import { useState, useMemo, useCallback } from "react";
import { Habit } from "@/types/habit";
import { useTranslation } from "react-i18next";
import TitleInput from "@/ui/TitleInput";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

export type HabitFormValues = {
  name: string;
  type: "manual" | "duration";
  targetValue: number | null;
  frequencyDays: number[] | null;
  alarmType: "normal" | "priority";
};

type HabitFormProps = {
  initialValues?: Habit;
  onSave: (values: HabitFormValues) => void;
  onAutoSave?: (values: HabitFormValues) => Promise<void>;
  isSaving: boolean;
};

// Display order: Mon first. value = weekday number (1=Sun, 2=Mon, ..., 7=Sat)
const DAYS = [
  { key: "mon", value: 2 },
  { key: "tue", value: 3 },
  { key: "wed", value: 4 },
  { key: "thu", value: 5 },
  { key: "fri", value: 6 },
  { key: "sat", value: 7 },
  { key: "sun", value: 1 },
];

export default function HabitForm({ initialValues, onSave, onAutoSave, isSaving }: HabitFormProps) {
  const { t } = useTranslation("habits");
  const isEdit = !!initialValues;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<"manual" | "duration">(
    initialValues?.type === "duration" ? "duration" : "manual",
  );
  const [hoursStr, setHoursStr] = useState(() => {
    if (initialValues?.target_value) return String(Math.floor(initialValues.target_value / 3600));
    return "0";
  });
  const [minutesStr, setMinutesStr] = useState(() => {
    if (initialValues?.target_value) return String(Math.floor((initialValues.target_value % 3600) / 60));
    return "30";
  });

  const hours = parseInt(hoursStr) || 0;
  const minutes = parseInt(minutesStr) || 0;
  const [frequencyMode, setFrequencyMode] = useState<"daily" | "specific">(
    initialValues?.frequency_days ? "specific" : "daily",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialValues?.frequency_days ?? [],
  );
  const [alarmType, setAlarmType] = useState<"normal" | "priority">(
    initialValues?.alarm_type ?? "normal",
  );

  const toggleDay = (value: number) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  };

  const isDuration = type === "duration";
  const durationInSeconds = hours * 3600 + minutes * 60;

  const canSave = isDuration
    ? !!name.trim() && durationInSeconds > 0
    : !!name.trim();

  // Auto-save for edit mode
  const autoSaveData = useMemo(
    () => ({
      name,
      type,
      durationInSeconds,
      alarmType,
      frequencyMode,
      selectedDays: [...selectedDays].sort(),
    }),
    [name, type, durationInSeconds, alarmType, frequencyMode, selectedDays],
  );

  const handleAutoSave = useCallback(async () => {
    if (!canSave || !onAutoSave) return;
    const targetValue = isDuration ? durationInSeconds : null;
    const frequencyDays = frequencyMode === "specific" && selectedDays.length > 0
      ? selectedDays
      : null;
    await onAutoSave({
      name: name.trim(),
      type,
      targetValue,
      frequencyDays,
      alarmType: isDuration ? alarmType : "normal",
    });
  }, [canSave, onAutoSave, isDuration, durationInSeconds, frequencyMode, selectedDays, name, type, alarmType]);

  const { status } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    enabled: isEdit && !!onAutoSave,
  });

  const handleSubmit = () => {
    if (!canSave) return;

    const targetValue = isDuration ? durationInSeconds : null;
    const frequencyDays = frequencyMode === "specific" && selectedDays.length > 0
      ? selectedDays
      : null;

    onSave({
      name: name.trim(),
      type,
      targetValue,
      frequencyDays,
      alarmType: isDuration ? alarmType : "normal",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {isEdit && <AutoSaveIndicator status={status} />}

      {/* Habit type selector (only on create) */}
      {!isEdit && (
        <div className="flex flex-col gap-4">
          <p className="text-lg">{t("habits.habitType")}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setType("manual")}
              className={`flex-1 ${type === "manual" ? "btn-add" : "btn-neutral"}`}
            >
              {t("habits.typeManual")}
            </button>
            <button
              onClick={() => setType("duration")}
              className={`flex-1 ${type === "duration" ? "btn-add" : "btn-neutral"}`}
            >
              {t("habits.typeDuration")}
            </button>
          </div>
        </div>
      )}

      {/* Name input */}
      <div>
        <TitleInput
          value={name}
          setValue={setName}
          placeholder={t("habits.habitNamePlaceholder")}
          label={t("habits.habitName")}
        />
      </div>

      {/* Duration picker */}
      {isDuration && (
        <div className="flex flex-col gap-4">
          <p className="text-lg">{t("habits.durationTarget")}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={hoursStr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v === "") { setHoursStr(""); return; }
                  const n = Math.min(23, parseInt(v));
                  setHoursStr(String(n));
                }}
                onBlur={() => { if (!hoursStr) setHoursStr("0"); }}
                className="w-16 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-center font-body text-slate-200"
              />
              <span className="font-body text-slate-400">{t("habits.hours")}</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={minutesStr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v === "") { setMinutesStr(""); return; }
                  const n = Math.min(59, parseInt(v));
                  setMinutesStr(String(n));
                }}
                onBlur={() => { if (!minutesStr) setMinutesStr("0"); }}
                className="w-16 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-center font-body text-slate-200"
              />
              <span className="font-body text-slate-400">{t("habits.minutes")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Frequency selection */}
      <div className="flex flex-col gap-4">
        <p className="text-lg">{t("habits.frequency")}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setFrequencyMode("daily");
              setSelectedDays([]);
            }}
            className={`flex-1 ${frequencyMode === "daily" ? "btn-add" : "btn-neutral"}`}
          >
            {t("habits.frequencyDaily")}
          </button>
          <button
            onClick={() => setFrequencyMode("specific")}
            className={`flex-1 ${frequencyMode === "specific" ? "btn-add" : "btn-neutral"}`}
          >
            {t("habits.frequencySpecific")}
          </button>
        </div>

        {frequencyMode === "specific" && (
          <div>
            <p className="font-body text-slate-400 mb-2">{t("habits.selectDays")}</p>
            <div className="flex gap-2">
              {DAYS.map(({ key, value }) => (
                <button
                  key={key}
                  onClick={() => toggleDay(value)}
                  className={`w-10 h-10 rounded-full text-sm font-body cursor-pointer transition-colors ${
                    selectedDays.includes(value)
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                      : "bg-gray-500/20 border border-gray-500/40 text-slate-400 hover:bg-gray-500/35"
                  }`}
                >
                  {t(`habits.days_short.${key}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save button (create mode only) */}
      {!isEdit && (
        <div className="pt-10">
          <button
            onClick={handleSubmit}
            disabled={!canSave || isSaving}
            className={`w-full py-3 rounded-md text-center cursor-pointer transition-all ${
              !canSave || isSaving ? "btn-disabled" : "btn-save"
            }`}
          >
            {t("habits.save")}
          </button>
        </div>
      )}
    </div>
  );
}
