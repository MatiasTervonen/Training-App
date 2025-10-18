import { formatDate } from "@/lib/formatDate";
import { Feed_item } from "@/types/session";
import { View } from "react-native";
import AppText from "../AppText";
import CopyText from "../CopyToClipboard";

export default function NotesSession(notes: Feed_item) {
  return (
    <View className="flex-1 items-center px-4 text-gray-100 max-w-md mx-auto pb-10">
      <AppText className="text-sm text-gray-400 mt-5">
        {formatDate(notes.created_at!)}
      </AppText>
      <View className="items-center">
        <AppText className="my-5 text-xl break-words">{notes.title}</AppText>
        <AppText className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          {notes.notes}
        </AppText>
      </View>
      <View className="mt-10">
        <CopyText textToCopy={notes.notes!} />
      </View>
    </View>
  );
}
