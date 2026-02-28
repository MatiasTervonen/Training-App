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
import { useState } from "react";
import BodyText from "@/components/BodyText";
import RichContent from "../components/notesWebview";
import { stripHtml } from "@/lib/stripHtml";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

type notesPayload = {
  notes: string;
  "voice-count"?: number;
  "image-count"?: number;
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
  const [viewerIndex, setViewerIndex] = useState(-1);
  const payload = note.extra_fields as notesPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const images = voiceRecordings?.images ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <AppText className="text-sm text-gray-300 text-center">
          {t("notes.expandedView.created")} {formatDate(note.created_at!)}
        </AppText>
        {note.updated_at && (
          <AppText className="text-sm text-yellow-500 mt-2 text-center">
            {t("notes.expandedView.updated")} {formatDate(note.updated_at)}
          </AppText>
        )}
        <View className="relative bg-slate-900 px-5 pt-5 pb-10 rounded-md shadow-md mt-5">
          <View className="absolute top-2 right-2 z-10">
            <CopyText textToCopy={note.title + "\n\n" + stripHtml(payload.notes)} />
          </View>
          <AppText className="text-xl text-center mb-10 border-b border-gray-700 pb-2">
            {note.title}
          </AppText>
          {payload.notes.startsWith("<") ? (
            <RichContent html={payload.notes} />
          ) : (
            <BodyText className="text-[15px] leading-6 text-gray-200">
              {payload.notes}
            </BodyText>
          )}
          {/* Images */}
          {imageCount > 0 && (
            <View className="mt-10">
              {isLoadingVoice ? (
                <NotesVoiceSkeleton count={imageCount} />
              ) : (
                images.map((image, idx) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onPress={() => setViewerIndex(idx)}
                  />
                ))
              )}
            </View>
          )}
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

      </PageContainer>
      {images.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={images}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </ScrollView>
  );
}
