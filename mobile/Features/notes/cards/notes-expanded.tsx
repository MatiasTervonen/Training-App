import { formatDate } from "@/lib/formatDate";
import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import CopyText from "@/components/CopyToClipboard";
import PageContainer from "@/components/PageContainer";
import { FeedItemUI } from "@/types/session";
import { FullNotesSession } from "@/database/notes/get-full-notes";
import { DraftRecordingItem } from "../components/draftRecording";
import { NotesVoiceSkeleton } from "@/components/skeletetons";
import { useTranslation } from "react-i18next";
import BodyText from "@/components/BodyText";

type notesPayload = {
  notes: string;
  "voice-count"?: number;
};

type NotesSessionProps = {
  note: FeedItemUI;
  voiceRecordings?: FullNotesSession | null;
  isLoadingVoice?: boolean;
  error?: unknown;
};

export default function NotesSession({
  note,
  voiceRecordings,
  isLoadingVoice,
  error,
}: NotesSessionProps) {
  const { t } = useTranslation("notes");
  const payload = note.extra_fields as notesPayload;
  const voiceCount = payload["voice-count"] ?? 0;

  return (
    <ScrollView>
      <PageContainer className="mb-10">
        <AppText className="text-sm text-gray-300 text-center">
          {t("notes.expandedView.created")} {formatDate(note.created_at!)}
        </AppText>
        {note.updated_at && (
          <AppText className="text-sm text-yellow-500 mt-2 text-center">
            {t("notes.expandedView.updated")} {formatDate(note.updated_at)}
          </AppText>
        )}
        <View className="bg-slate-900 px-5 pt-5 pb-10 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-10 border-b border-gray-700 pb-2">
            {note.title}
          </AppText>
          <BodyText className="text-left">{payload.notes}</BodyText>
          {/* Voice Recordings */}
          {voiceCount > 0 && (
            <View className="mt-14">
              {isLoadingVoice ? (
                <NotesVoiceSkeleton count={voiceCount} />
              ) : error ? (
                <AppText className="text-center text-red-500 mt-10">
                  {t("notes.expandedView.voiceLoadError")}
                </AppText>
              ) : (
                voiceRecordings?.voiceRecordings.map((recording) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.duration_ms ?? undefined}
                  />
                ))
              )}
            </View>
          )}
        </View>

        <View className="mt-10">
          <CopyText textToCopy={note.title + "\n\n" + payload.notes} />
        </View>
      </PageContainer>
    </ScrollView>
  );
}
