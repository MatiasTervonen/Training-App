import { useState, useEffect, useRef } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import {
  full_todo_session_optional_id,
  FeedItemUI,
} from "@/types/session";
import { editTodo } from "@/database/todo/edit-todo";
import AnimatedButton from "@/components/buttons/animatedButton";
import { View, Pressable, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import PageContainer from "@/components/PageContainer";
import { useConfirmAction } from "@/lib/confirmAction";
import { Dot } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid/non-secure";
import { TodoTaskMedia } from "@/database/todo/get-todo-media";
import TodoTaskCard from "@/features/todo/components/TodoTaskCard";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  taskMedia?: TodoTaskMedia;
};

export default function EditTodo({
  todo_session,
  onClose,
  onSave,
  onDirtyChange,
  taskMedia,
}: Props) {
  const { t } = useTranslation(["todo", "common"]);

  const applyTaskMedia = (
    tasks: typeof todo_session.todo_tasks,
    media: TodoTaskMedia,
  ) =>
    tasks.map((task) => {
      const m = task.id ? media[task.id] : undefined;
      if (!m) return task;
      return {
        ...task,
        existingVoice: m.voice?.map((v) => ({
          id: v.id,
          uri: v.uri,
          storage_path: v.storage_path,
          duration_ms: v.duration_ms,
        })),
        existingImages: m.images?.map((img) => ({
          id: img.id,
          uri: img.uri,
          storage_path: img.storage_path,
        })),
        existingVideos: m.videos?.map((v) => ({
          id: v.id,
          uri: v.uri,
          thumbnailUri: v.thumbnailUri,
          storage_path: v.storage_path,
          thumbnail_storage_path: v.thumbnail_storage_path,
          duration_ms: v.duration_ms,
        })),
      };
    });

  const initData = taskMedia
    ? { ...todo_session, todo_tasks: applyTaskMedia(todo_session.todo_tasks, taskMedia) }
    : todo_session;

  const [originalData, setOriginalData] = useState(initData);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const mediaAppliedRef = useRef(!!taskMedia);

  const [sessionData, setSessionData] = useState(initData);

  useEffect(() => {
    if (taskMedia && !mediaAppliedRef.current) {
      mediaAppliedRef.current = true;
      const apply = (prev: typeof sessionData) => ({
        ...prev,
        todo_tasks: applyTaskMedia(prev.todo_tasks, taskMedia),
      });
      setSessionData(apply);
      setOriginalData(apply);
    }
  }, [taskMedia]);

  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletedVoiceIds, setDeletedVoiceIds] = useState<string[]>([]);
  const [deletedVoicePaths, setDeletedVoicePaths] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState<string[]>([]);
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);
  const [deletedVideoPaths, setDeletedVideoPaths] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [viewerTaskIndex, setViewerTaskIndex] = useState<number | null>(null);

  const confirmAction = useConfirmAction();

  const handleTitleChange = (value: string) => {
    setSessionData((prev) => ({ ...prev, title: value }));
  };

  const updateTask = (
    index: number,
    updater: (
      task: (typeof sessionData.todo_tasks)[number],
    ) => Partial<(typeof sessionData.todo_tasks)[number]>,
  ) => {
    setSessionData((prev) => ({
      ...prev,
      todo_tasks: prev.todo_tasks.map((t, i) =>
        i === index ? { ...t, ...updater(t) } : t,
      ),
    }));
  };

  const addNewTask = () => {
    const newIndex = sessionData.todo_tasks.length;
    setSessionData((prev) => ({
      ...prev,
      todo_tasks: [
        ...prev.todo_tasks,
        {
          tempId: Crypto.randomUUID(),
          task: "",
          notes: "",
          created_at: new Date().toISOString(),
          is_completed: false,
          list_id: prev.id,
          user_id: prev.user_id,
          updated_at: "",
          position: 0,
        },
      ],
    }));
    setExpandedIndex(newIndex);
  };

  const handleDeleteItem = async (index: number) => {
    const confirmed = await confirmAction({
      title: t("todo.deleteTaskTitle"),
      message: t("todo.deleteTaskMessage"),
    });
    if (!confirmed) return;

    setSessionData((prev) => {
      const deletedTask = prev.todo_tasks[index];
      if (deletedTask?.id)
        setDeletedIds((ids) => [...ids, deletedTask.id as string]);
      return {
        ...prev,
        todo_tasks: prev.todo_tasks.filter((_, i) => i !== index),
      };
    });

    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  const updated = new Date().toISOString();

  const handleSave = async () => {
    if (sessionData.todo_tasks.some((task) => task.draftVideos?.some((v) => v.isCompressing))) {
      Toast.show({ type: "info", text1: t("common:common.media.videoStillCompressing") });
      return;
    }

    const hasEmptyTasks = sessionData.todo_tasks.some(
      (task) => task.task.trim().length === 0,
    );

    if (hasEmptyTasks) {
      Toast.show({
        type: "error",
        text1: t("todo.editScreen.emptyTasksError"),
        text2: t("todo.editScreen.emptyTasksErrorSub"),
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedFeedItem = await editTodo({
        id: sessionData.id,
        title: sessionData.title,
        tasks: sessionData.todo_tasks.map((task, index) => ({
          id: task.id ?? null,
          task: task.task,
          notes: task.notes ?? undefined,
          position: index,
          updated_at: updated,
          newRecordings: task.draftRecordings,
          newImages: task.draftImages,
          newVideos: task.draftVideos,
        })),
        deletedIds,
        updated_at: updated,
        deletedVoiceIds,
        deletedVoicePaths,
        deletedImageIds,
        deletedImagePaths,
        deletedVideoIds,
        deletedVideoPaths,
      });

      onSave({ ...updatedFeedItem, feed_context: todo_session.feed_context });
      onClose();
      Toast.show({
        type: "success",
        text1: t("todo.editScreen.updateSuccess"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("todo.editScreen.updateError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData) !== JSON.stringify(originalData) ||
    deletedVoiceIds.length > 0 ||
    deletedImageIds.length > 0 ||
    deletedVideoIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const getViewerImages = (taskIndex: number) => {
    const task = sessionData.todo_tasks[taskIndex];
    const existing = (task.existingImages ?? []).map((img) => ({
      id: img.id,
      uri: img.uri,
    }));
    const draft = (task.draftImages ?? []).map((img) => ({
      id: img.id,
      uri: img.uri,
    }));
    return [...existing, ...draft];
  };

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {t("todo.session.unsavedChanges")}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <PageContainer className="justify-between items-center gap-5 max-w-lg">
            <View className="w-full">
              <AppText className="text-lg text-center mb-10">
                {t("todo.editScreen.title")}
              </AppText>
              <View className="w-full mb-10">
                <AppInput
                  value={sessionData.title}
                  setValue={handleTitleChange}
                  placeholder={t("todo.editScreen.titlePlaceholder")}
                  label={t("todo.editScreen.titleLabel")}
                />
              </View>

              <View className="w-full">
                {sessionData.todo_tasks.map((task, index) => (
                  <TodoTaskCard
                    key={task.id ?? task.tempId}
                    index={index}
                    task={task.task}
                    notes={task.notes ?? ""}
                    isExpanded={expandedIndex === index}
                    onToggleExpand={() =>
                      setExpandedIndex(
                        expandedIndex === index ? null : index,
                      )
                    }
                    onTaskChange={(value) =>
                      updateTask(index, () => ({ task: value }))
                    }
                    onNotesChange={(value) =>
                      updateTask(index, () => ({ notes: value }))
                    }
                    onDelete={() => handleDeleteItem(index)}
                    draftImages={task.draftImages}
                    draftVideos={task.draftVideos}
                    draftRecordings={task.draftRecordings}
                    existingImages={task.existingImages}
                    existingVideos={task.existingVideos}
                    existingVoice={task.existingVoice}
                    onAddImage={(image) =>
                      updateTask(index, (t) => ({
                        draftImages: image.isLoading
                          ? [...(t.draftImages ?? []), image]
                          : !image.uri
                            ? (t.draftImages ?? []).filter((img) => img.id !== image.id)
                            : (t.draftImages ?? []).map((img) =>
                                img.id === image.id ? image : img,
                              ),
                      }))
                    }
                    onAddVideo={(video) =>
                      updateTask(index, (t) => ({
                        draftVideos: (t.draftVideos ?? []).some((v) => v.id === video.id)
                          ? !video.uri
                            ? (t.draftVideos ?? []).filter((v) => v.id !== video.id)
                            : (t.draftVideos ?? []).map((v) => v.id === video.id ? video : v)
                          : video.isCompressing ? [...(t.draftVideos ?? []), video] : (t.draftVideos ?? []),
                      }))
                    }
                    onAddRecording={(uri, durationMs) =>
                      updateTask(index, (t) => ({
                        draftRecordings: [
                          ...(t.draftRecordings ?? []),
                          {
                            id: nanoid(),
                            uri,
                            createdAt: Date.now(),
                            durationMs,
                          },
                        ],
                      }))
                    }
                    onDeleteDraftImage={(id) =>
                      updateTask(index, (t) => ({
                        draftImages: t.draftImages?.filter(
                          (img) => img.id !== id,
                        ),
                      }))
                    }
                    onDeleteDraftVideo={(id) =>
                      updateTask(index, (t) => ({
                        draftVideos: t.draftVideos?.filter(
                          (v) => v.id !== id,
                        ),
                      }))
                    }
                    onDeleteDraftRecording={(id) =>
                      updateTask(index, (t) => ({
                        draftRecordings: t.draftRecordings?.filter(
                          (r) => r.id !== id,
                        ),
                      }))
                    }
                    onDeleteExistingImage={(id) => {
                      const task = sessionData.todo_tasks[index];
                      const image = task.existingImages?.find((img) => img.id === id);
                      if (image) {
                        setDeletedImagePaths((prev) => [...prev, image.storage_path]);
                      }
                      setDeletedImageIds((prev) => [...prev, id]);
                      updateTask(index, (t) => ({
                        existingImages: t.existingImages?.filter(
                          (img) => img.id !== id,
                        ),
                      }));
                    }}
                    onDeleteExistingVideo={(id) => {
                      const task = sessionData.todo_tasks[index];
                      const video = task.existingVideos?.find((v) => v.id === id);
                      if (video) {
                        const paths = [video.storage_path];
                        if (video.thumbnail_storage_path) paths.push(video.thumbnail_storage_path);
                        setDeletedVideoPaths((prev) => [...prev, ...paths]);
                      }
                      setDeletedVideoIds((prev) => [...prev, id]);
                      updateTask(index, (t) => ({
                        existingVideos: t.existingVideos?.filter(
                          (v) => v.id !== id,
                        ),
                      }));
                    }}
                    onDeleteExistingVoice={(id) => {
                      const task = sessionData.todo_tasks[index];
                      const voice = task.existingVoice?.find((v) => v.id === id);
                      if (voice) {
                        setDeletedVoicePaths((prev) => [...prev, voice.storage_path]);
                      }
                      setDeletedVoiceIds((prev) => [...prev, id]);
                      updateTask(index, (t) => ({
                        existingVoice: t.existingVoice?.filter(
                          (v) => v.id !== id,
                        ),
                      }));
                    }}
                    onImagePress={(imgIdx) => {
                      setViewerTaskIndex(index);
                      setViewerIndex(imgIdx);
                    }}
                    cardClassName="bg-slate-900"
                  />
                ))}
              </View>
            </View>

            <View className="w-full pt-5 flex flex-col gap-5">
              <AnimatedButton
                onPress={addNewTask}
                label={t("todo.editScreen.addTask")}
                className="btn-base py-2"
                textClassName="text-gray-100 text-center"
              />
              <SaveButton
                disabled={!hasChanges}
                onPress={handleSave}
                label={
                  !hasChanges
                    ? t("todo.session.save")
                    : t("todo.session.saveChanges")
                }
              />
            </View>
          </PageContainer>
        </Pressable>
      </KeyboardAwareScrollView>

      <FullScreenLoader
        visible={isSaving}
        message={t("todo.editScreen.savingTodoList")}
      />

      {viewerTaskIndex !== null &&
        getViewerImages(viewerTaskIndex).length > 0 &&
        viewerIndex >= 0 && (
          <ImageViewerModal
            images={getViewerImages(viewerTaskIndex)}
            initialIndex={viewerIndex}
            visible={viewerIndex >= 0}
            onClose={() => {
              setViewerIndex(-1);
              setViewerTaskIndex(null);
            }}
          />
        )}
    </View>
  );
}
