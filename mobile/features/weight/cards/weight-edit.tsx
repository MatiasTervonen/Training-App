import { useState, useEffect } from "react";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { View, ScrollView, Pressable, Keyboard } from "react-native";
import { editWeight } from "@/database/weight/edit-weight";
import PageContainer from "@/components/PageContainer";
import { FeedItemUI, DraftVideo } from "@/types/session";
import { Dot } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FullWeightSession } from "@/database/weight/get-full-weight";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import { nanoid } from "nanoid/non-secure";
import { useConfirmAction } from "@/lib/confirmAction";
import { NotesVoiceSkeleton } from "@/components/skeletetons";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import MediaToolbar from "@/features/notes/components/MediaToolbar";

type Props = {
  weight: FeedItemUI;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  weightMedia?: FullWeightSession | null;
  isLoadingMedia?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
};

type weightPayload = {
  notes: string;
  weight: number;
  "voice-count"?: number;
  "image-count"?: number;
  "video-count"?: number;
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

export default function EditWeight({
  weight,
  onClose,
  onSave,
  weightMedia,
  isLoadingMedia = false,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation(["weight", "common"]);
  const payload = weight.extra_fields as weightPayload;
  const voiceCount = payload["voice-count"] ?? 0;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const confirmAction = useConfirmAction();

  const [title, setValue] = useState(weight.title);
  const [notes, setNotes] = useState(payload.notes);
  const [weightValue, setWeightValue] = useState(
    payload.weight != null ? payload.weight.toString() : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<number | undefined>(
    undefined,
  );

  // Voice recordings state
  const [existingRecordings, setExistingRecordings] = useState<
    ExistingRecording[]
  >([]);
  const [deletedRecordingIds, setDeletedRecordingIds] = useState<string[]>([]);
  const [deletedRecordingPaths, setDeletedRecordingPaths] = useState<string[]>(
    [],
  );
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

  const initialTitle = weight.title || "";
  const initialNotes = payload.notes || "";
  const initialWeight =
    payload.weight != null ? payload.weight.toString() : "";

  // Sync existing media from props
  useEffect(() => {
    if (weightMedia?.voiceRecordings) {
      setExistingRecordings(weightMedia.voiceRecordings);
    }
    if (weightMedia?.images) {
      setExistingImages(weightMedia.images);
    }
    if (weightMedia?.videos) {
      setExistingVideos(weightMedia.videos);
    }
  }, [
    weightMedia?.voiceRecordings,
    weightMedia?.images,
    weightMedia?.videos,
  ]);

  const handleDeleteExisting = async (recordingId: string) => {
    const confirmed = await confirmAction({
      title: t("weight.editScreen.deleteRecordingTitle"),
      message: t("weight.editScreen.deleteRecordingMessage"),
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
      title: t("weight.editScreen.deleteRecordingTitle"),
      message: t("weight.editScreen.deleteRecordingMessage"),
    });
    if (!confirmed) return;

    setNewRecordings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    const confirmed = await confirmAction({
      title: t("weight.editScreen.deleteImageTitle"),
      message: t("weight.editScreen.deleteImageMessage"),
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
      title: t("weight.editScreen.deleteImageTitle"),
      message: t("weight.editScreen.deleteImageMessage"),
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
      const updatedFeedItem = await editWeight({
        id: weight.source_id,
        title,
        notes,
        weight: Number(weightValue),
        updated_at: new Date().toISOString(),
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

      onSave({ ...updatedFeedItem, feed_context: weight.feed_context });
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: t("weight:weight.editScreen.errorTitle"),
        text2: t("weight:weight.editScreen.errorMessage"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    weightValue !== initialWeight ||
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
            {t("weight.editScreen.unsavedChanges")}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <PageContainer className="mb-5">
            <AppText className="text-xl text-center mt-5 mb-10">
              {t("weight.editScreen.title")}
            </AppText>
            <View className="gap-5">
              <AppInput
                value={title || ""}
                onChangeText={setValue}
                placeholder={t("weight.titlePlaceholder")}
                label={t("weight.titleLabel")}
              />
              <SubNotesInput
                value={notes || ""}
                setValue={setNotes}
                placeholder={t("weight.notesPlaceholder")}
                label={t("weight.notesLabel")}
              />
              <AppInput
                value={weightValue}
                onChangeText={(val) => {
                  const numbersOnly = val.replace(/[^0-9.]/g, "");
                  setWeightValue(numbersOnly);
                }}
                placeholder={t("weight.weightPlaceholder")}
                label={t("weight.weightLabel")}
              />
            </View>

            {/* Existing Voice Recordings */}
            {(voiceCount > 0 ||
              existingRecordings.length > 0 ||
              newRecordings.length > 0) && (
              <View className="mt-5">
                <AppText className="mb-2">
                  {t("weight.editScreen.recordings")}
                </AppText>
                {isLoadingMedia ? (
                  <NotesVoiceSkeleton count={voiceCount} />
                ) : (
                  existingRecordings.map((recording) => (
                    <DraftRecordingItem
                      key={recording.id}
                      uri={recording.uri}
                      durationMs={recording.duration_ms ?? undefined}
                      deleteRecording={() =>
                        handleDeleteExisting(recording.id)
                      }
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
                <AppText className="mb-2">
                  {t("weight.editScreen.images")}
                </AppText>
                {isLoadingMedia ? (
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
                    onPress={() =>
                      setViewerIndex(existingImages.length + index)
                    }
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
                <AppText className="mb-2">
                  {t("weight.editScreen.videos")}
                </AppText>
                {isLoadingMedia ? (
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

            {/* Media Toolbar */}
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
                    return prev.map((img) =>
                      img.id === image.id ? image : img,
                    );
                  });
                }}
                onVideoSelected={(video) => {
                  setNewVideos((prev) => {
                    if (prev.some((v) => v.id === video.id)) {
                      if (!video.uri) {
                        return prev.filter((v) => v.id !== video.id);
                      }
                      return prev.map((v) =>
                        v.id === video.id ? video : v,
                      );
                    }
                    return video.isCompressing ? [...prev, video] : prev;
                  });
                }}
                currentImageCount={existingImages.length + newImages.length}
                currentVideoCount={existingVideos.length + newVideos.length}
                currentVoiceCount={
                  existingRecordings.length + newRecordings.length
                }
                showFolderButton={false}
              />
            </View>
          </PageContainer>
        </Pressable>
      </ScrollView>
      <View className="px-5 pb-5 pt-3">
        <SaveButton
          disabled={!hasChanges}
          onPress={handleSubmit}
          label={
            !hasChanges
              ? t("weight.editScreen.save")
              : t("weight.editScreen.saveChanges")
          }
        />
      </View>
      <FullScreenLoader
        visible={isSaving}
        message={
          savingProgress !== undefined
            ? t("common:common.media.uploading")
            : t("weight:weight.editScreen.savingWeight")
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
