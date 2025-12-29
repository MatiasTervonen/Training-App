import { formatDate } from "@/lib/formatDate";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import CopyText from "../CopyToClipboard";
import PageContainer from "../PageContainer";
import { FeedItemUI } from "@/types/session";

type notesPayload = {
  notes: string;
};

export default function NotesSession(notes: FeedItemUI) {
  const payload = notes.extra_fields as notesPayload;

  return (
    <ScrollView>
      <PageContainer className="mb-10">
        <AppText className="text-sm text-gray-300 text-center">
          created: {formatDate(notes.created_at!)}
        </AppText>
        {notes.updated_at && (
          <AppText className="text-sm text-yellow-500 mt-2 text-center">
            updated: {formatDate(notes.updated_at)}
          </AppText>
        )}
        <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {notes.title}
          </AppText>
          <AppText className="text-lg text-left">{payload.notes}</AppText>
        </View>
        <View className="mt-10">
          <CopyText textToCopy={notes.title + "\n\n" + payload.notes} />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
