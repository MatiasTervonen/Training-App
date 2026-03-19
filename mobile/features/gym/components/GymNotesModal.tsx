import { ScrollView, View, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import AppInput from "@/components/AppInput";
import NotesInput from "@/components/NotesInput";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import { useState, type SetStateAction } from "react";
import { nanoid } from "nanoid/non-secure";
import { useConfirmAction } from "@/lib/confirmAction";
import { DraftVideo, DraftRecording } from "@/types/session";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { AutoSaveStatus } from "@/hooks/useAutoSave";
import {
  SessionImage,
  SessionVideo,
  SessionVoiceRecording,
} from "@/database/gym/get-full-gym-session";

type DraftImage = { id: string; uri: string; isLoading?: boolean };

type GymNotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (title: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  isEditing?: boolean;
  draftRecordings: DraftRecording[];
  setDraftRecordings: (value: SetStateAction<DraftRecording[]>) => void;
  draftImages: DraftImage[];
  setDraftImages: (value: SetStateAction<DraftImage[]>) => void;
  draftVideos: DraftVideo[];
  setDraftVideos: (value: SetStateAction<DraftVideo[]>) => void;
  existingImages?: SessionImage[];
  existingVideos?: SessionVideo[];
  existingRecordings?: SessionVoiceRecording[];
  onDeleteExistingImage?: (id: string) => void;
  onDeleteExistingVideo?: (id: string) => void;
  onDeleteExistingRecording?: (id: string) => void;
  autoSaveStatus?: AutoSaveStatus;
};

export default function GymNotesModal({
  isOpen,
  onClose,
  title,
  setTitle,
  notes,
  setNotes,
  isEditing,
  draftRecordings,
  setDraftRecordings,
  draftImages,
  setDraftImages,
  draftVideos,
  setDraftVideos,
  existingImages = [],
  existingVideos = [],
  existingRecordings = [],
  onDeleteExistingImage,
  onDeleteExistingVideo,
  onDeleteExistingRecording,
  autoSaveStatus,
}: GymNotesModalProps) {
  const { t } = useTranslation(["gym", "notes"]);
  const confirmAction = useConfirmAction();
  const [viewerIndex, setViewerIndex] = useState(-1);
  const modalScroll = useFullScreenModalScroll();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };

  const allImages = [
    ...existingImages.map((img) => ({ id: img.id, uri: img.uri })),
    ...draftImages.map((img) => ({ id: img.id, uri: img.uri })),
  ];

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose} scrollable={false}>
      {autoSaveStatus && <AutoSaveIndicator status={autoSaveStatus} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <PageContainer className="pt-10">
          <AppText className="text-2xl mb-6 text-center">
            {t("gym.gymForm.notesModalTitle")}
          </AppText>

          <AppInput
            label={t("gym.gymForm.titleLabel")}
            value={title}
            setValue={setTitle}
            placeholder={t("gym.gymForm.titlePlaceholder")}
          />

          <View className="mt-5">
            <NotesInput
              label={t("gym.gymForm.notesLabel")}
              value={notes}
              setValue={setNotes}
              placeholder={t("gym.gymForm.notesPlaceholder")}
            />
          </View>

          {/* Existing Voice Recordings */}
          {existingRecordings.length > 0 && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes:notes.recordings")}</AppText>
              {existingRecordings.map((recording) => (
                <DraftRecordingItem
                  key={recording.id}
                  uri={recording.uri}
                  durationMs={recording.duration_ms ?? undefined}
                  deleteRecording={async () => {
                    const confirm = await confirmAction({
                      title: t("notes:notes.deleteRecordingTitle"),
                      message: t("notes:notes.deleteRecordingMessage"),
                    });
                    if (!confirm) return;
                    onDeleteExistingRecording?.(recording.id);
                  }}
                />
              ))}
            </View>
          )}

          {/* New Voice Recordings */}
          {draftRecordings.length > 0 && (
            <View className={existingRecordings.length === 0 ? "mt-5" : ""}>
              {existingRecordings.length === 0 && (
                <AppText className="mb-2">{t("notes:notes.recordings")}</AppText>
              )}
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

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <View className="mt-5">
              {existingImages.map((image, idx) => (
                <DraftImageItem
                  key={image.id}
                  uri={image.uri}
                  onPress={() => setViewerIndex(idx)}
                  onDelete={async () => {
                    const confirm = await confirmAction({
                      title: t("notes:notes.images.deleteImageTitle"),
                      message: t("notes:notes.images.deleteImageMessage"),
                    });
                    if (!confirm) return;
                    onDeleteExistingImage?.(image.id);
                  }}
                />
              ))}
            </View>
          )}

          {/* New Images */}
          {draftImages.length > 0 && (
            <View className={existingImages.length === 0 ? "mt-5" : ""}>
              {draftImages.map((image, index) => (
                <DraftImageItem
                  key={image.id}
                  uri={image.uri}
                  isLoading={image.isLoading}
                  onPress={() => setViewerIndex(existingImages.length + index)}
                  onDelete={async () => {
                    const confirm = await confirmAction({
                      title: t("notes:notes.images.deleteImageTitle"),
                      message: t("notes:notes.images.deleteImageMessage"),
                    });
                    if (!confirm) return;
                    setDraftImages((prev) => prev.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </View>
          )}

          {/* Existing Videos */}
          {existingVideos.length > 0 && (
            <View className="mt-5">
              {existingVideos.map((video) => (
                <DraftVideoItem
                  key={video.id}
                  uri={video.uri}
                  thumbnailUri={video.thumbnailUri}
                  durationMs={video.duration_ms ?? undefined}
                  onDelete={async () => {
                    onDeleteExistingVideo?.(video.id);
                  }}
                />
              ))}
            </View>
          )}

          {/* New Videos */}
          {draftVideos.length > 0 && (
            <View className={existingVideos.length === 0 ? "mt-5" : ""}>
              {draftVideos.map((video, index) => (
                <DraftVideoItem
                  key={video.id}
                  uri={video.uri}
                  thumbnailUri={video.thumbnailUri}
                  durationMs={video.durationMs}
                  isCompressing={video.isCompressing}
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
              onImageSelected={(image) =>
                setDraftImages((prev) => {
                  if (image.isLoading) {
                    return [...prev, image];
                  }
                  if (!image.uri) {
                    return prev.filter((img) => img.id !== image.id);
                  }
                  return prev.map((img) =>
                    img.id === image.id ? image : img,
                  );
                })
              }
              onVideoSelected={(video) =>
                setDraftVideos((prev) => {
                  if (prev.some((v) => v.id === video.id)) {
                    if (!video.uri) {
                      return prev.filter((v) => v.id !== video.id);
                    }
                    return prev.map((v) => v.id === video.id ? video : v);
                  }
                  return video.isCompressing ? [...prev, video] : prev;
                })
              }
              currentImageCount={existingImages.length + draftImages.length}
              currentVideoCount={existingVideos.length + draftVideos.length}
              currentVoiceCount={existingRecordings.length + draftRecordings.length}
              folders={[]}
              selectedFolderId={null}
              onFolderSelect={() => {}}
              showFolderButton={false}
            />
          </View>

          <View className="h-10" />
        </PageContainer>
      </ScrollView>

      {allImages.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={allImages}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </FullScreenModal>
  );
}
