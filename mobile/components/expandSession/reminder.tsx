import { formatDate, formatDateTime } from "@/lib/formatDate";
import { Bell, CalendarSync } from "lucide-react-native";
import { View } from "react-native";
import AppText from "../AppText";
import { LinearGradient } from "expo-linear-gradient";
import { reminders } from "@/types/models";

export default function ReminderSession(reminder: reminders) {
  const formattedDate = formatDate(reminder.created_at!);

  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }} // bottom-left
      end={{ x: 0, y: 1 }} // top-right
      className={`mt-20 mb-10 pt-10 px-6 rounded-xl w-full border border-slate-700 overflow-hidden shadow-md`}
    >
      <View className="flex-row justify-center">
        <View className="items-center justify-center mt-5 bg-slate-600 p-5 rounded-md flex-1 border border-gray-600">
          <CalendarSync color="#f3f4f6" />
          <AppText className="mt-2 text-xl text-center">Global</AppText>
        </View>
        <View className="items-center justify-center mt-5 bg-slate-600 p-5 rounded-md flex-1 ml-5 border border-gray-600">
          <Bell color="#f3f4f6" />

          <View className="flex-row items-center gap-3 justify-center">
            <AppText className="text-center mt-2 text-lg">
              {formatDateTime(reminder.notify_at!)}
            </AppText>
          </View>
        </View>
      </View>
      <View className="bg-slate-600 mt-5 rounded-md p-5 w-full">
        <AppText className="text-xl break-words text-center">
          {reminder.title}
        </AppText>
      </View>
      {reminder.notes && (
        <View className="whitespace-pre-wrap break-words bg-slate-600 p-4 rounded-md shadow-md mt-5 border border-gray-60">
          <AppText className="text-center">{reminder.notes}</AppText>
        </View>
      )}
      <AppText className="text-sm text-gray-400 mb-2 mt-8">
        Created at: {formattedDate}
      </AppText>
    </LinearGradient>
  );
}
