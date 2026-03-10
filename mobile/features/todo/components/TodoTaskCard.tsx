import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Paperclip } from "lucide-react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import TaskMediaList from "@/features/todo/components/TaskMediaList";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";

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
  index: number;
  task: string;
  notes: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTaskChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDelete: () => void;
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  draftRecordings?: DraftRecording[];
  existingImages?: ExistingImage[];
  existingVideos?: ExistingVideo[];
  existingVoice?: ExistingVoice[];
  onAddRecording: (uri: string, durationMs: number) => void;
  onAddImage: (image: { id: string; uri: string; isLoading: boolean }) => void;
  onAddVideo: (video: DraftVideo) => void;
  onDeleteDraftImage?: (id: string) => void;
  onDeleteDraftVideo?: (id: string) => void;
  onDeleteDraftRecording?: (id: string) => void;
  onDeleteExistingImage?: (id: string) => void;
  onDeleteExistingVideo?: (id: string) => void;
  onDeleteExistingVoice?: (id: string) => void;
  onImagePress?: (imageIndex: number) => void;
  cardClassName?: string;
};

export default function TodoTaskCard({
  index,
  task,
  notes,
  isExpanded,
  onToggleExpand,
  onTaskChange,
  onNotesChange,
  onDelete,
  draftImages,
  draftVideos,
  draftRecordings,
  existingImages,
  existingVideos,
  existingVoice,
  onAddRecording,
  onAddImage,
  onAddVideo,
  onDeleteDraftImage,
  onDeleteDraftVideo,
  onDeleteDraftRecording,
  onDeleteExistingImage,
  onDeleteExistingVideo,
  onDeleteExistingVoice,
  onImagePress,
  cardClassName = "bg-slate-800",
}: Props) {
  const { t } = useTranslation("todo");

  const mediaCount =
    (draftImages?.length ?? 0) +
    (draftVideos?.length ?? 0) +
    (draftRecordings?.length ?? 0) +
    (existingImages?.length ?? 0) +
    (existingVideos?.length ?? 0) +
    (existingVoice?.length ?? 0);

  if (!isExpanded) {
    return (
      <AnimatedButton
        onPress={onToggleExpand}
        className={`${cardClassName} p-4 rounded-lg mb-3 flex-row items-center`}
      >
        <AppText className="mr-2">{index + 1}.</AppText>
        <AppText
          className={`flex-1 ${task ? "text-gray-100" : "text-gray-500"}`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task || t("todo.taskPlaceholder")}
        </AppText>
        {mediaCount > 0 && (
          <View className="flex-row items-center mr-2">
            <Paperclip size={14} color="#9ca3af" />
            <AppText className="text-gray-400 text-sm ml-1">
              {mediaCount}
            </AppText>
          </View>
        )}
        <ChevronDown size={20} color="#9ca3af" />
      </AnimatedButton>
    );
  }

  return (
    <View className={`${cardClassName} p-4 rounded-lg mb-3`}>
      <View className="flex-row justify-between items-center mb-4">
        <AppText>{index + 1}.</AppText>
        <View className="flex-row items-center gap-3">
          <AnimatedButton
            onPress={onDelete}
            label={t("todo.editScreen.delete")}
            textClassName="text-red-500"
            hitSlop={10}
          />
          <AnimatedButton onPress={onToggleExpand} hitSlop={10}>
            <ChevronUp size={20} color="#9ca3af" />
          </AnimatedButton>
        </View>
      </View>

      <AppInput
        value={task}
        setValue={onTaskChange}
        placeholder={t("todo.taskPlaceholder")}
        label={t("todo.editScreen.taskLabel")}
      />

      <View className="mt-4">
        <SubNotesInput
          value={notes}
          setValue={onNotesChange}
          placeholder={t("todo.notesPlaceholder")}
          label={t("todo.editScreen.notesLabel")}
        />
      </View>

      <View className="mt-3">
        <MediaToolbar
          onRecordingComplete={onAddRecording}
          onImageSelected={onAddImage}
          onVideoSelected={onAddVideo}
          showFolderButton={false}
          currentImageCount={
            (existingImages?.length ?? 0) + (draftImages?.length ?? 0)
          }
          currentVideoCount={
            (existingVideos?.length ?? 0) + (draftVideos?.length ?? 0)
          }
          currentVoiceCount={
            (existingVoice?.length ?? 0) + (draftRecordings?.length ?? 0)
          }
        />
      </View>

      <TaskMediaList
        draftImages={draftImages}
        draftVideos={draftVideos}
        draftRecordings={draftRecordings}
        existingImages={existingImages}
        existingVideos={existingVideos}
        existingVoice={existingVoice}
        onDeleteDraftImage={onDeleteDraftImage}
        onDeleteDraftVideo={onDeleteDraftVideo}
        onDeleteDraftRecording={onDeleteDraftRecording}
        onDeleteExistingImage={onDeleteExistingImage}
        onDeleteExistingVideo={onDeleteExistingVideo}
        onDeleteExistingVoice={onDeleteExistingVoice}
        onImagePress={onImagePress}
      />
    </View>
  );
}
