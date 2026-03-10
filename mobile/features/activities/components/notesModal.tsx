import { ScrollView, View } from "react-native";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import AppInput from "@/components/AppInput";
import NotesInput from "@/components/NotesInput";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import type { SetStateAction } from "react";
import { nanoid } from "nanoid/non-secure";
import { useConfirmAction } from "@/lib/confirmAction";
import { DraftRecording, DraftVideo } from "@/types/session";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";

type DraftImage = { id: string; uri: string };

type NotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  title: string;
  setTitle: (title: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  draftRecordings: DraftRecording[];
  setDraftRecordings: (value: SetStateAction<DraftRecording[]>) => void;
  draftImages: DraftImage[];
  setDraftImages: (value: SetStateAction<DraftImage[]>) => void;
  draftVideos: DraftVideo[];
  setDraftVideos: (value: SetStateAction<DraftVideo[]>) => void;
};

export default function NotesModal({
  isOpen,
  onClose,
  activityName,
  title,
  setTitle,
  notes,
  setNotes,
  draftRecordings,
  setDraftRecordings,
  draftImages,
  setDraftImages,
  draftVideos,
  setDraftVideos,
}: NotesModalProps) {
  const { t } = useTranslation("activities");

  const confirmAction = useConfirmAction();

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageContainer className="pt-10">
          <AppText className="text-2xl mb-6 text-center">
            {activityName}
          </AppText>
          <AppInput
            label={t("activities.startActivityScreen.sessionNameLabel")}
            value={title}
            setValue={setTitle}
            placeholder={t(
              "activities.startActivityScreen.sessionNamePlaceholder",
            )}
          />
          <View className="mt-5">
            <NotesInput
              label={t("activities.startActivityScreen.sessionNotesLabel")}
              value={notes}
              setValue={setNotes}
              placeholder={t(
                "activities.startActivityScreen.sessionNotesPlaceholder",
              )}
            />
          </View>

          {draftRecordings.length > 0 && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes:notes.recordings")}</AppText>
              {draftRecordings.map((recording, index) => (
                <DraftRecordingItem
                  key={recording.id}
                  uri={recording.uri}
                  durationMs={recording.durationMs}
                  deleteRecording={async () => {
                    const confirm = await confirmAction({
                      title: t("notes:notes.deleteRecordingTitle"),
                      message: t("notes:notes.deleteRecordingMessage"),
                    });
                    if (!confirm) return;

                    setDraftRecordings((prev) =>
                      prev.filter((_, i) => i !== index),
                    );
                  }}
                />
              ))}
            </View>
          )}

          {draftImages.length > 0 && (
            <View className="mt-5">
              {draftImages.map((image, index) => (
                <DraftImageItem
                  key={image.id}
                  uri={image.uri}
                  onDelete={() =>
                    setDraftImages((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              ))}
            </View>
          )}

          {draftVideos.length > 0 && (
            <View className="mt-5">
              {draftVideos.map((video, index) => (
                <DraftVideoItem
                  key={video.id}
                  uri={video.uri}
                  thumbnailUri={video.thumbnailUri}
                  durationMs={video.durationMs}
                  onDelete={() =>
                    setDraftVideos((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              ))}
            </View>
          )}

          <View className="mt-5">
            <MediaToolbar
              onRecordingComplete={(uri, duration) => {
                setDraftRecordings((prev) => [
                  ...prev,
                  { id: nanoid(), uri, createdAt: Date.now(), durationMs: duration },
                ]);
              }}
              onImageSelected={(uri) =>
                setDraftImages((prev) => [...prev, { id: nanoid(), uri }])
              }
              onVideoSelected={(uri, thumbnailUri, durationMs) =>
                setDraftVideos((prev) => [
                  ...prev,
                  { id: nanoid(), uri, thumbnailUri, durationMs },
                ])
              }
              currentImageCount={draftImages.length}
              currentVideoCount={draftVideos.length}
              currentVoiceCount={draftRecordings.length}
              folders={[]}
              selectedFolderId={null}
              onFolderSelect={() => {}}
              showFolderButton={false}
            />
          </View>

          <View className="h-10" />
        </PageContainer>
      </ScrollView>
    </FullScreenModal>
  );
}
