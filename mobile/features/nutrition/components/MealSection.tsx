import { useState } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import FoodLogItem from "@/features/nutrition/components/FoodLogItem";
import { DailyFoodLog } from "@/database/nutrition/get-daily-logs";
import DatePicker from "react-native-date-picker";
import { useTranslation } from "react-i18next";
import { Bookmark, Clock } from "lucide-react-native";

type MealSectionProps = {
  title: string;
  items: DailyFoodLog[];
  onPress?: (item: DailyFoodLog) => void;
  onDelete: (id: string) => void;
  onUpdateMealTime?: (mealTime: string) => void;
  onSaveAsMeal?: () => void;
};

function getMealTime(items: DailyFoodLog[]): string | null {
  const first = items.find((item) => item.meal_time != null);
  return first?.meal_time ?? null;
}

function formatMealTime(time: string): string {
  // meal_time comes as "HH:MM:SS" from Postgres TIME — show only HH:MM
  return time.slice(0, 5);
}

function timeToDate(time: string | null): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

export default function MealSection({
  title,
  items,
  onPress,
  onDelete,
  onUpdateMealTime,
  onSaveAsMeal,
}: MealSectionProps) {
  const { t, i18n } = useTranslation(["nutrition", "common"]);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein ?? 0), 0);
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs ?? 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat ?? 0), 0);
  const mealTime = getMealTime(items);

  return (
    <View className="gap-2 mb-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <AppText className="text-base">{title}</AppText>
          {mealTime ? (
            <AnimatedButton
              onPress={() => setPickerOpen(true)}
              hitSlop={8}
            >
              <BodyTextNC className="text-sm text-slate-500">
                {formatMealTime(mealTime)}
              </BodyTextNC>
            </AnimatedButton>
          ) : onUpdateMealTime ? (
            <AnimatedButton
              onPress={() => setPickerOpen(true)}
              hitSlop={8}
            >
              <Clock size={14} color="#64748b" />
            </AnimatedButton>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          {onSaveAsMeal && (
            <AnimatedButton onPress={onSaveAsMeal} hitSlop={8}>
              <Bookmark size={14} color="#64748b" />
            </AnimatedButton>
          )}
          <BodyTextNC className="text-sm text-slate-400">
            {Math.round(totalCalories)} kcal
          </BodyTextNC>
        </View>
      </View>
      <View className="flex-row gap-3">
        <BodyTextNC className="text-xs text-slate-500">
          {t("daily.protein")} {Math.round(totalProtein)}g
        </BodyTextNC>
        <BodyTextNC className="text-xs text-slate-500">
          {t("daily.carbs")} {Math.round(totalCarbs)}g
        </BodyTextNC>
        <BodyTextNC className="text-xs text-slate-500">
          {t("daily.fat")} {Math.round(totalFat)}g
        </BodyTextNC>
      </View>
      <View className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
        {items.map((item, index) => (
          <FoodLogItem
            key={item.id}
            item={item}
            onPress={() => onPress?.(item)}
            onDelete={() => onDelete(item.id)}
            showBorder={index < items.length - 1}
          />
        ))}
      </View>

      {onUpdateMealTime && (
        <DatePicker
          date={timeToDate(mealTime)}
          onDateChange={() => {}}
          mode="time"
          modal
          open={pickerOpen}
          locale={i18n.language}
          title={t("common:datePicker.selectTime")}
          confirmText={t("common:datePicker.confirm")}
          cancelText={t("common:datePicker.cancel")}
          onConfirm={(date) => {
            setPickerOpen(false);
            const hh = String(date.getHours()).padStart(2, "0");
            const mm = String(date.getMinutes()).padStart(2, "0");
            onUpdateMealTime(`${hh}:${mm}`);
          }}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </View>
  );
}
