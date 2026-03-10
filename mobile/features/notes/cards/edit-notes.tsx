import { useState, useEffect } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { View, ScrollView } from "react-native";
import { editNotes } from "@/database/notes/edit-notes";
import PageContainer from "@/components/PageContainer";
import { Dot } from "lucide-react-native";
import { FeedItemUI, DraftVideo } from "@/types/session";
import { FullNotesSession } from "@/database/notes/get-full-notes";
import { DraftRecordingItem } from "../components/draftRecording";
import { nanoid } from "nanoid/non-secure";
import { useConfirmAction } from "@/lib/confirmAction";
import { NotesVoiceSkeleton } from "@/components/skeletetons";
import { useTranslation } from "react-i18next";
import useFolders from "@/features/notes/hooks/useFolders";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import MediaToolbar from "@/features/notes/components/MediaToolbar";

type Props = {
  note: FeedItemUI;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  voiceRecordings?: FullNotesSession | null;
  isLoadingVoice?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
};

type notesPayload = {
  notes: string;
  "voice-count"?: number;
  "image-count"?: number;
  "video-count"?: number;
  folder_id?: string | null;
};

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type ExistingRecording = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
  uri: string;
};

type ExistingImage = {
  id: string;
  storage_path: string;
  uri: string;
};

type DraftImage = {
  id: string;
  uri: string;
  isLoading?: boolean;
};

type ExistingVideo = {
  id: string;
  storage_path: string;
  thumbnail_storage_path: string | null;
  uri: string;
  thumbnailUri: string;
  duration_ms: number | null;
};

export default function EditNotes({
  note,
  onClose,
  onSave,
  voiceRecordings,
  isLoadingVoice = false,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation(["notes", "common"]);
  const payload = note.extra_fields as notesPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const confirmAction = useConfirmAction();
  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<number | undefined>(
    undefined,
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    payload.folder_id ?? null,
  );
  const initialFolderId = payload.folder_id ?? null;
  const { folders, isLoading: isFoldersLoading } = useFolders();

  // Voice recordings state
  const [existingRecordings, setExistingRecordings] = useState<
    ExistingRecording[]
  >([]);
  const [deletedRecordingIds, setDeletedRecordingIds] = useState<string[]>([]);
  const [deletedRecordingPaths, setDeletedRecordingPaths] = useState<string[]>([]);
  const [newRecordings, setNewRecordings] = useState<DraftRecording[]>([]);

  // Image state
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<DraftImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(-1);

  // Video state
  const [existingVideos, setExistingVideos] = useState<ExistingVideo[]>([]);
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);
  const [deletedVideoPaths, setDeletedVideoPaths] = useState<string[]>([]);
  const [newVideos, setNewVideos] = useState<DraftVideo[]>([]);

  const initialTitle = note.title || "";
  const initialNotes = payload.notes || "";

  // Sync existing recordings, images, and videos from props
  useEffect(() => {
    if (voiceRecordings?.voiceRecordings) {
      setExistingRecordings(voiceRecordings.voiceRecordings);
    }
    if (voiceRecordings?.images) {
      setExistingImages(voiceRecordings.images);
    }
    if (voiceRecordings?.videos) {
      setExistingVideos(voiceRecordings.videos);
    }
  }, [
    voiceRecordings?.voiceRecordings,
    voiceRecordings?.images,
    voiceRecordings?.videos,
  ]);

  const handleDeleteExisting = async (recordingId: string) => {
    const confirmed = await confirmAction({
      title: t("notes.deleteRecordingTitle"),
      message: t("notes.deleteRecordingMessage"),
    });
    if (!confirmed) return;

    const recording = existingRecordings.find((r) => r.id === recordingId);
    if (recording) {
      setDeletedRecordingPaths((prev) => [...prev, recording.storage_path]);
    }
    setDeletedRecordingIds((prev) => [...prev, recordingId]);
    setExistingRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  };

  const handleDeleteNew = async (index: number) => {
    const confirmed = await confirmAction({
      title: t("notes.deleteRecordingTitle"),
      message: t("notes.deleteRecordingMessage"),
    });
    if (!confirmed) return;

    setNewRecordings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = await confirmAction({
      title: t("notes.images.deleteImageTitle"),
      message: t("notes.images.deleteImageMessage"),
    });
    if (!confirmed) return;

    const image = existingImages.find((img) => img.id === imageId);
    if (image) {
      setDeletedImagePaths((prev) => [...prev, image.storage_path]);
    }
    setDeletedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleDeleteNewImage = async (index: number) => {
    const confirmed = await confirmAction({
      title: t("notes.images.deleteImageTitle"),
      message: t("notes.images.deleteImageMessage"),
    });
    if (!confirmed) return;

    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVideo = (videoId: string) => {
    const video = existingVideos.find((v) => v.id === videoId);
    if (video) {
      const paths = [video.storage_path];
      if (video.thumbnail_storage_path) paths.push(video.thumbnail_storage_path);
      setDeletedVideoPaths((prev) => [...prev, ...paths]);
    }
    setDeletedVideoIds((prev) => [...prev, videoId]);
    setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  const handleDeleteNewVideo = (index: number) => {
    setNewVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (newVideos.some((v) => v.isCompressing)) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.videoStillCompressing"),
      });
      return;
    }

    setIsSaving(true);
    setSavingProgress(undefined);

    try {
      const updatedFeedItem = await editNotes({
        id: note.source_id,
        title,
        notes,
        updated_at: new Date().toISOString(),
        folderId: selectedFolderId,
        deletedRecordingIds,
        deletedRecordingPaths,
        newRecordings,
        deletedImageIds,
        deletedImagePaths,
        newImages,
        deletedVideoIds,
        deletedVideoPaths,
        newVideos,
        onProgress: (p) => setSavingProgress(p),
      });

      onSave({ ...updatedFeedItem, feed_context: note.feed_context });
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: t("notes:notes.editScreen.errorTitle"),
        text2: t("notes:notes.editScreen.errorMessage"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    selectedFolderId !== initialFolderId ||
    deletedRecordingIds.length > 0 ||
    newRecordings.length > 0 ||
    deletedImageIds.length > 0 ||
    newImages.length > 0 ||
    deletedVideoIds.length > 0 ||
    newVideos.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? t("notes.editScreen.unsavedChanges") : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <PageContainer className="mb-5">
          <AppText className="text-xl text-center mt-5 mb-10">
            {t("notes.editScreen.title")}
          </AppText>
          <View className="mb-5">
            <AppInput
              value={title || ""}
              onChangeText={setValue}
              placeholder={t("notes.titlePlaceholder")}
              label={t("notes.titleLabel")}
            />
          </View>
          <NotesInput
            value={notes}
            setValue={setNotes}
            label={t("notes.notesLabel")}
            placeholder={t("notes.notesPlaceholder")}
          />
          {/* Existing Voice Recordings */}
          {(voiceCount > 0 ||
            existingRecordings.length > 0 ||
            newRecordings.length > 0) && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes.recordings")}</AppText>
              {isLoadingVoice ? (
                <NotesVoiceSkeleton count={voiceCount} />
              ) : (
                existingRecordings.map((recording) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.duration_ms ?? undefined}
                    deleteRecording={() => handleDeleteExisting(recording.id)}
                  />
                ))
              )}
            </View>
          )}

          {/* New Voice Recordings */}
          {newRecordings.length > 0 && (
            <View>
              {newRecordings.map((recording, index) => (
                <DraftRecordingItem
                  key={recording.id}
                  uri={recording.uri}
                  durationMs={recording.durationMs}
                  deleteRecording={() => handleDeleteNew(index)}
                />
              ))}
            </View>
          )}

          {/* Existing Images */}
          {(imageCount > 0 ||
            existingImages.length > 0 ||
            newImages.length > 0) && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes.images.title")}</AppText>
              {isLoadingVoice ? (
                <NotesVoiceSkeleton count={imageCount} />
              ) : (
                existingImages.map((image, idx) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onPress={() => setViewerIndex(idx)}
                    onDelete={() => handleDeleteExistingImage(image.id)}
                  />
                ))
              )}
            </View>
          )}

          {/* New Images */}
          {newImages.length > 0 && (
            <View>
              {newImages.map((image, index) => (
                <DraftImageItem
                  key={image.id}
                  uri={image.uri}
                  isLoading={image.isLoading}
                  onPress={() => setViewerIndex(existingImages.length + index)}
                  onDelete={() => handleDeleteNewImage(index)}
                />
              ))}
            </View>
          )}

          {/* Existing Videos */}
          {(videoCount > 0 ||
            existingVideos.length > 0 ||
            newVideos.length > 0) && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes.videos.title")}</AppText>
              {isLoadingVoice ? (
                <NotesVoiceSkeleton count={videoCount} />
              ) : (
                existingVideos.map((video) => (
                  <DraftVideoItem
                    key={video.id}
                    uri={video.uri}
                    thumbnailUri={video.thumbnailUri}
                    durationMs={video.duration_ms ?? undefined}
                    onDelete={() => handleDeleteExistingVideo(video.id)}
                  />
                ))
              )}
            </View>
          )}

          {/* New Videos */}
          {newVideos.length > 0 && (
            <View>
              {newVideos.map((video, index) => (
                <DraftVideoItem
                  key={video.id}
                  uri={video.uri}
                  thumbnailUri={video.thumbnailUri}
                  durationMs={video.durationMs}
                  isCompressing={video.isCompressing}
                  onDelete={() => handleDeleteNewVideo(index)}
                />
              ))}
            </View>
          )}

          {/* Record New Voice Note & Add Image/Video */}
          <View className="mt-6">
            <MediaToolbar
              onRecordingComplete={(uri, durationMs) => {
                const newRecording = {
                  id: nanoid(),
                  uri,
                  createdAt: Date.now(),
                  durationMs,
                };
                setNewRecordings((prev) => [...prev, newRecording]);
              }}
              onImageSelected={(image) => {
                setNewImages((prev) => {
                  if (image.isLoading) {
                    return [...prev, image];
                  }
                  if (!image.uri) {
                    return prev.filter((img) => img.id !== image.id);
                  }
                  return prev.map((img) => (img.id === image.id ? image : img));
                });
              }}
              onVideoSelected={(video) => {
                setNewVideos((prev) => {
                  if (prev.some((v) => v.id === video.id)) {
                    if (!video.uri) {
                      return prev.filter((v) => v.id !== video.id);
                    }
                    return prev.map((v) => (v.id === video.id ? video : v));
                  }
                  return video.isCompressing ? [...prev, video] : prev;
                });
              }}
              currentImageCount={existingImages.length + newImages.length}
              currentVideoCount={existingVideos.length + newVideos.length}
              currentVoiceCount={
                existingRecordings.length + newRecordings.length
              }
              folders={isFoldersLoading ? [] : folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
            />
          </View>
        </PageContainer>
      </ScrollView>
      <View className="px-5 pb-5 pt-3">
        <SaveButton
          disabled={!hasChanges}
          onPress={handleSubmit}
          label={
            !hasChanges
              ? t("notes.editScreen.save")
              : t("notes.editScreen.saveChanges")
          }
        />
      </View>
      <FullScreenLoader
        visible={isSaving}
        message={
          savingProgress !== undefined
            ? t("common:common.media.uploading")
            : t("notes:notes.editScreen.savingNotes")
        }
        progress={savingProgress}
      />
      {(() => {
        const allImages = [...existingImages, ...newImages];
        return allImages.length > 0 && viewerIndex >= 0 ? (
          <ImageViewerModal
            images={allImages}
            initialIndex={viewerIndex}
            visible={viewerIndex >= 0}
            onClose={() => setViewerIndex(-1)}
          />
        ) : null;
      })()}
    </View>
  );
}
