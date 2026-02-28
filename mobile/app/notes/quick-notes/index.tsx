import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import useSaveDraft from "@/features/notes/hooks/useSaveDraft";
import useSaveNotes from "@/features/notes/hooks/useSaveNotes";
import { formatDateShort } from "@/lib/formatDate";
import { nanoid } from "nanoid/non-secure";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import useFolders from "@/features/notes/hooks/useFolders";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import { DraftVideo } from "@/types/session";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
};

export default function NotesScreen() {
  const { t } = useTranslation("notes");
  const now = formatDateShort(new Date());
  const [title, setTitle] = useState(`${t("notes.title")} - ${now}`);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [draftVideos, setDraftVideos] = useState<DraftVideo[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState(-1);

  const confirmAction = useConfirmAction();
  const { folders, isLoading: isFoldersLoading } = useFolders();

  const resetNote = () => {
    setTitle("");
    setNotes("");
    setDraftRecordings([]);
    setDraftImages([]);
    setDraftVideos([]);
    setSelectedFolderId(null);
    AsyncStorage.removeItem("notes_draft");
  };

  // useSaveDraft hook to save draft notes
  useSaveDraft({
    title,
    notes,
    draftRecordings,
    draftImages,
    draftVideos,
    setTitle,
    setNotes,
    setDraftRecordings,
    setDraftImages,
    setDraftVideos,
  });

  // useSaveNotes hook to save notes
  const { handleSaveNotes } = useSaveNotes({
    title,
    notes,
    folderId: selectedFolderId,
    draftRecordings,
    draftImages,
    draftVideos,
    setIsSaving,
    resetNote,
  });

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-2xl text-center mb-10">
              {t("notes.addNotesHere")}
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title}
                setValue={setTitle}
                label={t("notes.titleLabel")}
                placeholder={t("notes.titlePlaceholder")}
              />
            </View>
            <NotesInput
              value={notes}
              setValue={setNotes}
              label={t("notes.notesLabel")}
              placeholder={t("notes.notesPlaceholder")}
            />
            {draftRecordings.length > 0 && (
              <View className="mt-5">
                <AppText className=" mb-2">{t("notes.recordings")}</AppText>
                {draftRecordings.map((recording, index) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.durationMs}
                    deleteRecording={async () => {
                      const confirm = await confirmAction({
                        title: t("notes.deleteRecordingTitle"),
                        message: t("notes.deleteRecordingMessage"),
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
                <AppText className=" mb-2">{t("notes.images.title")}</AppText>
                {draftImages.map((image, index) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onPress={() => setViewerIndex(index)}
                    onDelete={async () => {
                      const confirm = await confirmAction({
                        title: t("notes.images.deleteImageTitle"),
                        message: t("notes.images.deleteImageMessage"),
                      });
                      if (!confirm) return;
                      setDraftImages((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                  />
                ))}
              </View>
            )}
            {draftVideos.length > 0 && (
              <View className="mt-5">
                <AppText className="mb-2">{t("notes.videos.title")}</AppText>
                {draftVideos.map((video, index) => (
                  <DraftVideoItem
                    key={video.id}
                    uri={video.uri}
                    thumbnailUri={video.thumbnailUri}
                    durationMs={video.durationMs}
                    onDelete={async () => {
                      const confirm = await confirmAction({
                        title: t("notes.videos.deleteVideoTitle"),
                        message: t("notes.videos.deleteVideoMessage"),
                      });
                      if (!confirm) return;
                      setDraftVideos((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                  />
                ))}
              </View>
            )}
            <View className="mt-6">
              <MediaToolbar
                onRecordingComplete={(uri, durationMs) => {
                  const newRecording = {
                    id: nanoid(),
                    uri,
                    createdAt: Date.now(),
                    durationMs,
                  };
                  setDraftRecordings((prev) => [...prev, newRecording]);
                }}
                onImageSelected={(uri) => {
                  setDraftImages((prev) => [...prev, { id: nanoid(), uri }]);
                }}
                onVideoSelected={(uri, thumbnailUri, durationMs) => {
                  setDraftVideos((prev) => [
                    ...prev,
                    { id: nanoid(), uri, thumbnailUri, durationMs },
                  ]);
                }}
                folders={isFoldersLoading ? [] : folders}
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
              />
            </View>
          </View>

          <View className="mt-10 flex-row gap-4">
            <View className="flex-1">
              <DeleteButton onPress={resetNote} />
            </View>
            <View className="flex-1">
              <SaveButton onPress={handleSaveNotes} />
            </View>
          </View>
        </PageContainer>
      </ScrollView>
      <FullScreenLoader visible={isSaving} message={t("notes.savingNotes")} />
      {draftImages.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={draftImages}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </View>
  );
}
