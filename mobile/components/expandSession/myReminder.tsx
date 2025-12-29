import { Bell, CalendarSync } from "lucide-react-native";
import { View } from "react-native";
import AppText from "../AppText";
import { full_reminder } from "@/types/session";
import { formatNotifyTime, formatDate, formatDateTime } from "@/lib/formatDate";
import { LinearGradient } from "expo-linear-gradient";

export default function MyReminderSession(reminder: full_reminder) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }} // bottom-left
      end={{ x: 0, y: 1 }} // top-right
      className={`mt-20 mb-10 pt-10 px-6 rounded-xl w-full border border-slate-700 overflow-hidden shadow-md`}
    >
      <View className="flex-row w-full">
        <View className="flex-1 min-w-0 items-center justify-center bg-slate-700 p-5 rounded-md border border-gray-400">
          <CalendarSync color="#f3f4f6" />
          <AppText className="mt-2 text-xl text-center">
            {reminder.type === "global_reminders" ? "Global" : reminder.type}
          </AppText>
        </View>
        <View className="flex-1 min-w-0  items-center justify-center  bg-slate-700 p-5 rounded-md ml-5 border border-gray-400">
          <Bell color="#f3f4f6" />
          {reminder.type === "one-time" ? (
            <AppText className="text-center mt-2 text-lg">
              {formatDateTime(reminder.notify_date!)}
            </AppText>
          ) : reminder.type === "global" ||
            reminder.type === "global_reminders" ? (
            <AppText className="text-center mt-2 text-lg">
              {formatDateTime(reminder.notify_at!)}
            </AppText>
          ) : (
            <AppText className="text-center mt-2 text-lg">
              {formatNotifyTime(reminder.notify_at_time!)}
            </AppText>
          )}
        </View>
      </View>
      {reminder.weekdays && reminder.weekdays.length > 0 && (
        <View className="bg-slate-700 rounded-md p-5 mt-5 border border-gray-400">
          <AppText className="text-center text-lg ">
            {reminder.weekdays.map((dayNum) => days[dayNum - 1]).join(", ")}
          </AppText>
        </View>
      )}
      <View className="bg-slate-700 mt-5 rounded-md p-5 w-full border border-gray-400 shadow-md">
        <AppText className="text-xl break-words text-center">
          {reminder.title}
        </AppText>
      </View>
      {reminder.notes && (
        <View className="whitespace-pre-wrap break-words bg-slate-700 p-4 rounded-md shadow-md mt-5 border border-gray-400">
          <AppText className="text-center">{reminder.notes}</AppText>
        </View>
      )}

      <AppText className="text-sm text-gray-300 mt-8 mb-2">
        Created: {formatDate(reminder.created_at)}
      </AppText>
      {reminder.updated_at && (
        <AppText className="text-sm text-yellow-500 mb-2">
          Updated: {formatDate(reminder.updated_at)}
        </AppText>
      )}
    </LinearGradient>
  );
}
