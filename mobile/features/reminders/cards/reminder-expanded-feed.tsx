import { Bell, CalendarSync, AlertTriangle } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import { FeedItemUI } from "@/types/session";
import { formatNotifyTime, formatDate, formatDateTime } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";

const typeTranslationKeys: Record<string, string> = {
  "one-time": "oneTime",
  weekly: "weekly",
  daily: "daily",
  global_reminders: "global",
};

type reminderPayload = {
  notify_date: string;
  notify_at: string;
  notify_at_time: string;
  weekdays: number[];
  notes: string;
  type: string;
  mode: "alarm" | "normal";
};

export default function ReminderSession(reminder: FeedItemUI) {
  const { t } = useTranslation("reminders");
  const payload = reminder.extra_fields as reminderPayload;

  const days = [
    t("reminders.days.sun"),
    t("reminders.days.mon"),
    t("reminders.days.tue"),
    t("reminders.days.wed"),
    t("reminders.days.thu"),
    t("reminders.days.fri"),
    t("reminders.days.sat"),
  ];

  return (
    <PageContainer>
      <AppText className="text-sm text-gray-400 text-center">
        {t("reminders.created")} {formatDate(reminder.created_at)}
      </AppText>
      {reminder.updated_at && (
        <AppText className="text-sm text-slate-400 mt-1 text-center">
          {t("reminders.updated")} {formatDate(reminder.updated_at)}
        </AppText>
      )}

      {payload.mode === "alarm" && (
        <View className="flex-row items-center justify-center gap-2 mt-4 bg-yellow-500/15 rounded-md px-3 py-2 self-center">
          <AlertTriangle size={16} color="#eab308" />
          <AppText className="text-sm text-yellow-500">
            {t("reminders.highPriorityReminder")}
          </AppText>
        </View>
      )}

      <AppText className="text-2xl text-center mt-5 break-words">
        {reminder.title}
      </AppText>

      <View className="bg-white/5 border border-white/10 rounded-md mt-6">
        {/* Type */}
        <View className="flex-row items-center px-4 py-4 border-b border-gray-700">
          <CalendarSync size={20} color="#94a3b8" />
          <AppText className="text-slate-400 text-sm ml-3">
            {t("reminders.typeLabel")}
          </AppText>
          <AppText className="ml-auto text-lg">
            {t(`reminders.${typeTranslationKeys[payload.type] || payload.type}`)}
          </AppText>
        </View>

        {/* Time */}
        <View className="flex-row items-center px-4 py-4 border-b border-gray-700">
          <Bell size={20} color="#94a3b8" />
          <AppText className="text-slate-400 text-sm ml-3">
            {t("reminders.timeLabel")}
          </AppText>
          <AppText className="ml-auto text-lg">
            {payload.type === "one-time"
              ? formatDateTime(payload.notify_date!)
              : reminder.type === "global" ||
                  reminder.type === "global_reminders"
                ? formatDateTime(payload.notify_at!)
                : formatNotifyTime(payload.notify_at_time!)}
          </AppText>
        </View>

        {/* Weekdays */}
        {payload.weekdays && payload.weekdays.length > 0 && (
          <View className="px-4 py-4 border-b border-gray-700">
            <AppText className="text-slate-400 text-sm mb-2">
              {t("reminders.weekdaysLabel")}
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {payload.weekdays.map((dayNum) => (
                <View
                  key={dayNum}
                  className="bg-white/10 rounded-md px-3 py-1"
                >
                  <AppText className="text-sm">{days[dayNum - 1]}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {payload.notes && (
          <View className="px-4 py-4">
            <BodyText className="text-gray-200 leading-5">{payload.notes}</BodyText>
          </View>
        )}
      </View>
    </PageContainer>
  );
}
