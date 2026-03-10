import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import { useConfirmAction } from "@/lib/confirmAction";

type ExistingImage = { id: string; uri: string };
type ExistingVideo = {
  id: string;
  uri: string;
  thumbnailUri: string;
  duration_ms: number | null;
};
type ExistingVoice = {
  id: string;
  uri: string;
  duration_ms: number | null;
};

type Props = {
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  draftRecordings?: DraftRecording[];
  existingImages?: ExistingImage[];
  existingVideos?: ExistingVideo[];
  existingVoice?: ExistingVoice[];
  onDeleteDraftImage?: (id: string) => void;
  onDeleteDraftVideo?: (id: string) => void;
  onDeleteDraftRecording?: (id: string) => void;
  onDeleteExistingImage?: (id: string) => void;
  onDeleteExistingVideo?: (id: string) => void;
  onDeleteExistingVoice?: (id: string) => void;
  onImagePress?: (index: number) => void;
};

export default function TaskMediaList({
  draftImages,
  draftVideos,
  draftRecordings,
  existingImages,
  existingVideos,
  existingVoice,
  onDeleteDraftImage,
  onDeleteDraftVideo,
  onDeleteDraftRecording,
  onDeleteExistingImage,
  onDeleteExistingVideo,
  onDeleteExistingVoice,
  onImagePress,
}: Props) {
  const { t } = useTranslation("todo");
  const confirmAction = useConfirmAction();

  const confirmDelete = async (callback: () => void) => {
    const confirmed = await confirmAction({
      title: t("todo.deleteMediaTitle"),
      message: t("todo.deleteMediaMessage"),
    });
    if (confirmed) callback();
  };

  const hasAny =
    (existingImages?.length ?? 0) > 0 ||
    (existingVideos?.length ?? 0) > 0 ||
    (existingVoice?.length ?? 0) > 0 ||
    (draftImages?.length ?? 0) > 0 ||
    (draftVideos?.length ?? 0) > 0 ||
    (draftRecordings?.length ?? 0) > 0;

  if (!hasAny) return null;

  const existingImageCount = existingImages?.length ?? 0;

  return (
    <View className="mt-3 gap-2">
      {existingImages?.map((image, idx) => (
        <DraftImageItem
          key={image.id}
          uri={image.uri}
          onDelete={
            onDeleteExistingImage
              ? () => confirmDelete(() => onDeleteExistingImage(image.id))
              : undefined
          }
          onPress={onImagePress ? () => onImagePress(idx) : undefined}
        />
      ))}
      {existingVideos?.map((video) => (
        <DraftVideoItem
          key={video.id}
          uri={video.uri}
          thumbnailUri={video.thumbnailUri}
          durationMs={video.duration_ms ?? undefined}
          onDelete={
            onDeleteExistingVideo
              ? () => confirmDelete(() => onDeleteExistingVideo(video.id))
              : undefined
          }
        />
      ))}
      {existingVoice?.map((voice) => (
        <DraftRecordingItem
          key={voice.id}
          uri={voice.uri}
          durationMs={voice.duration_ms ?? undefined}
          deleteRecording={
            onDeleteExistingVoice
              ? () => confirmDelete(() => onDeleteExistingVoice(voice.id))
              : undefined
          }
        />
      ))}
      {draftImages?.map((image, idx) => (
        <DraftImageItem
          key={image.id}
          uri={image.uri}
          onDelete={
            onDeleteDraftImage
              ? () => confirmDelete(() => onDeleteDraftImage(image.id))
              : undefined
          }
          onPress={
            onImagePress
              ? () => onImagePress(existingImageCount + idx)
              : undefined
          }
        />
      ))}
      {draftVideos?.map((video) => (
        <DraftVideoItem
          key={video.id}
          uri={video.uri}
          thumbnailUri={video.thumbnailUri}
          durationMs={video.durationMs}
          onDelete={
            onDeleteDraftVideo
              ? () => confirmDelete(() => onDeleteDraftVideo(video.id))
              : undefined
          }
        />
      ))}
      {draftRecordings?.map((rec) => (
        <DraftRecordingItem
          key={rec.id}
          uri={rec.uri}
          durationMs={rec.durationMs}
          deleteRecording={
            onDeleteDraftRecording
              ? () => confirmDelete(() => onDeleteDraftRecording(rec.id))
              : undefined
          }
        />
      ))}
    </View>
  );
}
