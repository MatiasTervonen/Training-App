import { Bell, CalendarSync } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { FeedItemUI } from "@/types/session";
import { formatNotifyTime, formatDate, formatDateTime } from "@/lib/formatDate";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }} // bottom-left
      end={{ x: 0, y: 1 }} // top-right
      className={`mt-20 mb-10 px-6 rounded-xl w-full border border-slate-700 overflow-hidden shadow-md ${payload.mode === "alarm" ? "pb-0" : "pt-10"}`}
    >
      {payload.mode === "alarm" && (
        <AppText className="text-sm text-yellow-500 my-4">
          {t("reminders.highPriorityReminder")}
        </AppText>
      )}
      <View className="flex-row items-center justify-center bg-slate-700 p-5 rounded-md border border-gray-400">
        <CalendarSync color="#f3f4f6" />
        <AppText className="ml-3 text-xl text-center">
          {t(`reminders.${typeTranslationKeys[payload.type] || payload.type}`)}
        </AppText>
      </View>
      <View className="flex-row items-center justify-center bg-slate-700 p-5 rounded-md mt-4 border border-gray-400">
        <Bell color="#f3f4f6" />
        {payload.type === "one-time" ? (
          <AppText className="text-center ml-3 text-lg">
            {formatDateTime(payload.notify_date!)}
          </AppText>
        ) : reminder.type === "global" ||
          reminder.type === "global_reminders" ? (
          <AppText className="text-center ml-3 text-lg">
            {formatDateTime(payload.notify_at!)}
          </AppText>
        ) : (
          <AppText className="text-center ml-3 text-lg">
            {formatNotifyTime(payload.notify_at_time!)}
          </AppText>
        )}
      </View>
      {payload.weekdays && payload.weekdays.length > 0 && (
        <View className="bg-slate-700 rounded-md p-5 mt-5 border border-gray-400">
          <AppText className="text-center text-lg ">
            {payload.weekdays.map((dayNum) => days[dayNum - 1]).join(", ")}
          </AppText>
        </View>
      )}
      <View className="bg-slate-700 mt-5 rounded-md p-5 w-full border border-gray-400 shadow-md">
        <AppText className="text-xl break-words text-center">
          {reminder.title}
        </AppText>
      </View>
      {payload.notes && (
        <View className="whitespace-pre-wrap break-words bg-slate-700 p-4 rounded-md shadow-md mt-5 border border-gray-400">
          <BodyText className="text-center">{payload.notes}</BodyText>
        </View>
      )}

      <AppText className="text-sm text-gray-300 mt-8 mb-2">
        {t("reminders.created")} {formatDate(reminder.created_at)}
      </AppText>
      {reminder.updated_at && (
        <AppText className="text-sm text-yellow-500 mb-2">
          {t("reminders.updated")} {formatDate(reminder.updated_at)}
        </AppText>
      )}
    </LinearGradient>
  );
}
