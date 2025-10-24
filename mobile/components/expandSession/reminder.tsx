import { formatDate, formatDateTime } from "@/lib/formatDate";
import CopyText from "@/components/CopyToClipboard";
import { Feed_item } from "@/types/session";
import { Bell } from "lucide-react-native";
import { View } from "react-native";
import AppText from "../AppText";

export default function ReminderSession(reminder: Feed_item) {
  const formattedDate = formatDate(reminder.created_at!);
  const formattedNotifyAt = formatDateTime(reminder.notify_at!);

  return (
    <View className="px-4 pb-10">
      <AppText className="text-sm text-gray-400 mt-10 text-center">
        {formattedDate}
      </AppText>
      <View>
        <AppText className="mt-5 text-xl break-words text-center">
          {reminder.title}
        </AppText>
        <View className="flex-row items-center justify-center gap-2 my-5 text-xl">
          <AppText>{reminder.notify_at && formattedNotifyAt}</AppText>
          <Bell color="#f3f4f6" />
        </View>
        {reminder.notes && (
          <View className="whitespace-pre-wrap break-words bg-slate-900 p-4 rounded-md shadow-md mt-5">
            <AppText className="text-center">{reminder.notes}</AppText>
          </View>
        )}
      </View>
      {reminder.notes && (
        <View className="mt-10">
          <CopyText
            textToCopy={`${reminder.title}\n${formattedNotifyAt}\n${reminder.notes}`}
          />
        </View>
      )}
    </View>
  );
}
