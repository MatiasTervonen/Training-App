import { formatDate } from "@/lib/formatDate";
import { Feed_item } from "@/types/session";
import { View } from "react-native";
import AppText from "../AppText";
import CopyText from "../CopyToClipboard";

export default function NotesSession(notes: Feed_item) {
  return (
    <View className="pb-10">
      <AppText className="text-lg text-gray-400 mt-10 text-center">
        {formatDate(notes.created_at!)}
      </AppText>
      <View className="items-center">
        <AppText className="my-5 text-xl break-words text-center">{notes.title}</AppText>
        <AppText className="text-lg whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-md mt-5">
          {notes.notes}
        </AppText>
      </View>
      <View className="mt-10">
        <CopyText textToCopy={notes.notes!} />
      </View>
    </View>
  );
}
