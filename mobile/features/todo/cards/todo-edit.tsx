import { useState, useEffect } from "react";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import {
  full_todo_session_optional_id,
  FeedItemUI,
  DraftRecording,
  DraftImage,
  DraftVideo,
} from "@/types/session";
import { editTodo } from "@/database/todo/edit-todo";
import SubNotesInput from "@/components/SubNotesInput";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import { View, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useConfirmAction } from "@/lib/confirmAction";
import { Dot } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid/non-secure";
import { TodoTaskMedia } from "@/database/todo/get-todo-media";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  taskMedia?: TodoTaskMedia;
};

type Task = {
  task: string;
  notes?: string;
  position: number;
  updated_at: string;
};

export default function EditTodo({
  todo_session,
  onClose,
  onSave,
  onDirtyChange,
  taskMedia,
}: Props) {
  const { t } = useTranslation("todo");
  const [originalData] = useState(todo_session);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState(() => {
    // Hydrate existing media into tasks
    if (taskMedia) {
      return {
        ...todo_session,
        todo_tasks: todo_session.todo_tasks.map((task) => {
          const media = task.id ? taskMedia[task.id] : undefined;
          return {
            ...task,
            existingVoice: media?.voice?.map((v) => ({
              id: v.id,
              uri: v.uri,
              duration_ms: v.duration_ms,
            })),
            existingImages: media?.images?.map((img) => ({
              id: img.id,
              uri: img.uri,
            })),
            existingVideos: media?.videos?.map((v) => ({
              id: v.id,
              uri: v.uri,
              thumbnailUri: v.thumbnailUri,
              duration_ms: v.duration_ms,
            })),
          };
        }),
      };
    }
    return todo_session;
  });
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletedVoiceIds, setDeletedVoiceIds] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [viewerTaskIndex, setViewerTaskIndex] = useState<number | null>(null);

  const confirmAction = useConfirmAction();

  const handleTitleChange = (value: string) => {
    setSessionData((prev) => ({ ...prev, title: value }));
  };

  const updateTask = (index: number, item: Partial<Task>) => {
    setSessionData((prev) => {
      const updatedTasks = [...prev.todo_tasks];
      updatedTasks[index] = { ...updatedTasks[index], ...item };
      return { ...prev, todo_tasks: updatedTasks };
    });
  };

  const addNewTask = () => {
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
  };

  const handleDeleteItem = async (index: number) => {
    const confirmed = await confirmAction({
      title: t("todo.deleteTaskTitle"),
      message: t("todo.deleteTaskMessage"),
    });
    if (!confirmed) return;

    setSessionData((prev) => {
      const updatedTasks = prev.todo_tasks[index];

      if (updatedTasks?.id)
        setDeletedIds((ids) => [...ids, updatedTasks.id as string]);

      const todo_tasks = prev.todo_tasks.filter((_, i) => i !== index);
      return { ...prev, todo_tasks };
    });
  };

  const updated = new Date().toISOString();

  const handleSave = async () => {
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
        deletedImageIds,
        deletedVideoIds,
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

  // Get all images for viewer (combine existing + draft for the task)
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
        <View className="bg-gray-900 absolute top-5 left-5 z-50  py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? t("todo.session.unsavedChanges") : ""}
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
        <PageContainer className="justify-between items-center gap-5 max-w-lg mb-5">
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
                <View
                  key={task.id ?? task.tempId}
                  className="text-gray-300 mb-5 bg-slate-900 p-4 rounded-lg"
                >
                  <View className="flex-row justify-between">
                    <AppText className="mb-2">{index + 1}.</AppText>
                    <AnimatedButton
                      onPress={() => handleDeleteItem(index)}
                      label={t("todo.editScreen.delete")}
                      textClassName="text-red-500"
                      hitSlop={10}
                    />
                  </View>
                  <AppInput
                    value={task.task}
                    setValue={(value) => updateTask(index, { task: value })}
                    placeholder={t("todo.editScreen.taskPlaceholder")}
                    label={t("todo.editScreen.taskLabel")}
                  />
                  <View className="mt-5">
                    <SubNotesInput
                      value={task.notes || ""}
                      setValue={(value) => updateTask(index, { notes: value })}
                      placeholder={t("todo.editScreen.notesPlaceholder")}
                      label={t("todo.editScreen.notesLabel")}
                    />
                  </View>
                  <View className="mt-3">
                    <MediaToolbar
                      onRecordingComplete={(uri, durationMs) => {
                        setSessionData((prev) => ({
                          ...prev,
                          todo_tasks: prev.todo_tasks.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  draftRecordings: [
                                    ...(t.draftRecordings ?? []),
                                    {
                                      id: nanoid(),
                                      uri,
                                      createdAt: Date.now(),
                                      durationMs,
                                    },
                                  ],
                                }
                              : t,
                          ),
                        }));
                      }}
                      onImageSelected={(uri) => {
                        setSessionData((prev) => ({
                          ...prev,
                          todo_tasks: prev.todo_tasks.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  draftImages: [
                                    ...(t.draftImages ?? []),
                                    { id: nanoid(), uri },
                                  ],
                                }
                              : t,
                          ),
                        }));
                      }}
                      onVideoSelected={(uri, thumbnailUri, durationMs) => {
                        setSessionData((prev) => ({
                          ...prev,
                          todo_tasks: prev.todo_tasks.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  draftVideos: [
                                    ...(t.draftVideos ?? []),
                                    {
                                      id: nanoid(),
                                      uri,
                                      thumbnailUri,
                                      durationMs,
                                    },
                                  ],
                                }
                              : t,
                          ),
                        }));
                      }}
                      showFolderButton={false}
                      folders={[]}
                      selectedFolderId={null}
                      onFolderSelect={() => {}}
                    />
                  </View>

                  {/* Existing media */}
                  {(task.existingImages?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.existingImages?.map((image, idx) => (
                        <DraftImageItem
                          key={image.id}
                          uri={image.uri}
                          onDelete={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setDeletedImageIds((prev) => [...prev, image.id]);
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      existingImages:
                                        t.existingImages?.filter(
                                          (img) => img.id !== image.id,
                                        ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                          onPress={() => {
                            setViewerTaskIndex(index);
                            setViewerIndex(idx);
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {(task.existingVideos?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.existingVideos?.map((video) => (
                        <DraftVideoItem
                          key={video.id}
                          uri={video.uri}
                          thumbnailUri={video.thumbnailUri}
                          durationMs={video.duration_ms ?? undefined}
                          onDelete={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setDeletedVideoIds((prev) => [...prev, video.id]);
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      existingVideos:
                                        t.existingVideos?.filter(
                                          (v) => v.id !== video.id,
                                        ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {(task.existingVoice?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.existingVoice?.map((voice) => (
                        <DraftRecordingItem
                          key={voice.id}
                          uri={voice.uri}
                          durationMs={voice.duration_ms ?? undefined}
                          deleteRecording={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setDeletedVoiceIds((prev) => [...prev, voice.id]);
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      existingVoice:
                                        t.existingVoice?.filter(
                                          (v) => v.id !== voice.id,
                                        ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                        />
                      ))}
                    </View>
                  )}

                  {/* New draft media */}
                  {(task.draftImages?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.draftImages?.map((image) => (
                        <DraftImageItem
                          key={image.id}
                          uri={image.uri}
                          onDelete={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      draftImages: t.draftImages?.filter(
                                        (img) => img.id !== image.id,
                                      ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {(task.draftVideos?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.draftVideos?.map((video) => (
                        <DraftVideoItem
                          key={video.id}
                          uri={video.uri}
                          thumbnailUri={video.thumbnailUri}
                          durationMs={video.durationMs}
                          onDelete={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      draftVideos: t.draftVideos?.filter(
                                        (v) => v.id !== video.id,
                                      ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {(task.draftRecordings?.length ?? 0) > 0 && (
                    <View className="mt-3">
                      {task.draftRecordings?.map((rec) => (
                        <DraftRecordingItem
                          key={rec.id}
                          uri={rec.uri}
                          durationMs={rec.durationMs}
                          deleteRecording={async () => {
                            const confirmed = await confirmAction({
                              title: t("todo.deleteMediaTitle"),
                              message: t("todo.deleteMediaMessage"),
                            });
                            if (!confirmed) return;
                            setSessionData((prev) => ({
                              ...prev,
                              todo_tasks: prev.todo_tasks.map((t, i) =>
                                i === index
                                  ? {
                                      ...t,
                                      draftRecordings:
                                        t.draftRecordings?.filter(
                                          (r) => r.id !== rec.id,
                                        ),
                                    }
                                  : t,
                              ),
                            }));
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View className="w-full pt-10 flex flex-col gap-5">
            <AnimatedButton
              onPress={addNewTask}
              label={t("todo.editScreen.addTask")}
              className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
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

        <FullScreenLoader
          visible={isSaving}
          message={t("todo.editScreen.savingTodoList")}
        />
      </KeyboardAwareScrollView>

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
