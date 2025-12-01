import { formatDate } from "@/lib/formatDate";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import CopyText from "../CopyToClipboard";
import PageContainer from "../PageContainer";
import { notes } from "@/types/models";

export default function NotesSession(notes: notes) {
  return (
    <ScrollView>
      <PageContainer className="mb-10">
        <AppText className="text-sm text-gray-300 text-center">
          created: {formatDate(notes.created_at!)}
        </AppText>
        {notes.updated_at && (
          <AppText className="text-sm text-gray-300 mt-2 text-center">
            updated: {formatDate(notes.updated_at)}
          </AppText>
        )}
        <View className="items-center">
          <AppText className="my-5 text-xl break-words text-center">
            {notes.title}
          </AppText>
          <AppText className="text-lg whitespace-pre-wrap break-words bg-slate-900 p-4 rounded-md shadow-md mt-5 text-center">
            {notes.notes}
          </AppText>
        </View>
        <View className="mt-10">
          <CopyText textToCopy={notes.notes!} />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
