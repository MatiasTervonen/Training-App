import {
  ListTodo,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
} from "lucide-react-native";
import { useState } from "react";
import { nanoid } from "nanoid/non-secure";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenModal from "@/components/FullScreenModal";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { saveTodoToDB } from "@/database/todo/save-todo";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConfirmAction } from "@/lib/confirmAction";
import PageContainer from "@/components/PageContainer";
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/features/todo/hooks/useSaveDraft";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";

type TodoItem = {
  tempId: string;
  task: string;
  notes: string | null;
  draftRecordings?: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
};

export default function CreateTodo() {
  const { t } = useTranslation("todo");
  const now = formatDateShort(new Date());

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(`${t("todo.title")} - ${now}`);
  const [task, setTask] = useState("");
  const [notes, setNotes] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<{ task: string; notes: string }>(
    {
      task: "",
      notes: "",
    },
  );
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [viewerItemId, setViewerItemId] = useState<string | null>(null);

  // Draft media for current task being added
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [draftVideos, setDraftVideos] = useState<DraftVideo[]>([]);

  const router = useRouter();

  const queryClient = useQueryClient();

  const confirmAction = useConfirmAction();

  // useSaveDraft hook to save draft todo list
  useSaveDraft({
    title,
    task,
    notes,
    todoList,
    setTitle,
    setTask,
    setNotes,
    setTodoList,
  });

  const handleDeleteItem = async (index: number) => {
    const confirmDelete = await confirmAction({
      title: t("todo.deleteTaskTitle"),
      message: t("todo.deleteTaskMessage"),
    });
    if (!confirmDelete) return;

    const newList = todoList.filter((_, i) => i !== index);
    setTodoList(newList);
  };

  const handleDeleteAll = () => {
    AsyncStorage.removeItem("todo_draft");
    setTodoList([]);
    setTask("");
    setNotes("");
    setTitle("");
    setDraftRecordings([]);
    setDraftImages([]);
    setDraftVideos([]);
  };

  const handleSaveTodo = async () => {
    if (!title.trim()) {
      Toast.show({ type: "error", text1: t("todo.emptyTitleError") });
      return;
    }
    if (todoList.length === 0) {
      Toast.show({ type: "error", text1: t("todo.emptyListError") });
      return;
    }
    setLoading(true);
    try {
      await saveTodoToDB({ title, todoList });

      await queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
      await queryClient.invalidateQueries({
        queryKey: ["myTodoLists"],
      });
      router.push("/dashboard");
      handleDeleteAll();
      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("todo.saveSuccess"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("todo.saveError"),
      });
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    if (task.trim() === "") return;
    setTodoList((prev) => [
      ...prev,
      {
        tempId: nanoid(),
        task,
        notes,
        draftRecordings:
          draftRecordings.length > 0 ? draftRecordings : undefined,
        draftImages: draftImages.length > 0 ? draftImages : undefined,
        draftVideos: draftVideos.length > 0 ? draftVideos : undefined,
      },
    ]);
    setNotes("");
    setTask("");
    setDraftRecordings([]);
    setDraftImages([]);
    setDraftVideos([]);
  };

  // Get images for the current viewer context
  const getViewerImages = () => {
    if (!viewerItemId) return [];
    const item = todoList.find((t) => t.tempId === viewerItemId);
    return (item?.draftImages ?? []).map((img) => ({ id: img.id, uri: img.uri }));
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <PageContainer className="justify-between">
        <View>
          <View className="flex-row items-center gap-2 justify-center mb-10">
            <AppText className="text-2xl">{t("todo.todoList")} </AppText>
            <ListTodo color="#f3f4f6" size={30} />
          </View>
          <View className="gap-5">
            <AppInput
              placeholder={t("todo.titlePlaceholder")}
              label={t("todo.addTitleLabel")}
              value={title}
              setValue={setTitle}
            />
            <AppInput
              placeholder={t("todo.taskPlaceholder")}
              label={t("todo.addTaskLabel")}
              value={task}
              setValue={setTask}
            />
            <SubNotesInput
              placeholder={t("todo.notesPlaceholder")}
              label={t("todo.addNotesLabel")}
              value={notes}
              setValue={setNotes}
            />
            <MediaToolbar
              onRecordingComplete={(uri, durationMs) => {
                setDraftRecordings((prev) => [
                  ...prev,
                  { id: nanoid(), uri, createdAt: Date.now(), durationMs },
                ]);
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
              currentImageCount={draftImages.length}
              currentVideoCount={draftVideos.length}
              currentVoiceCount={draftRecordings.length}
              showFolderButton={false}
              folders={[]}
              selectedFolderId={null}
              onFolderSelect={() => {}}
            />
            {/* Show draft media for current task being added */}
            {draftImages.length > 0 && (
              <View>
                {draftImages.map((image) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onDelete={async () => {
                      const confirmed = await confirmAction({
                        title: t("todo.deleteMediaTitle"),
                        message: t("todo.deleteMediaMessage"),
                      });
                      if (!confirmed) return;
                      setDraftImages((prev) =>
                        prev.filter((i) => i.id !== image.id),
                      );
                    }}
                  />
                ))}
              </View>
            )}
            {draftVideos.length > 0 && (
              <View>
                {draftVideos.map((video) => (
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
                      setDraftVideos((prev) =>
                        prev.filter((v) => v.id !== video.id),
                      );
                    }}
                  />
                ))}
              </View>
            )}
            {draftRecordings.length > 0 && (
              <View>
                {draftRecordings.map((recording) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.durationMs}
                    deleteRecording={async () => {
                      const confirmed = await confirmAction({
                        title: t("todo.deleteMediaTitle"),
                        message: t("todo.deleteMediaMessage"),
                      });
                      if (!confirmed) return;
                      setDraftRecordings((prev) =>
                        prev.filter((r) => r.id !== recording.id),
                      );
                    }}
                  />
                ))}
              </View>
            )}
          </View>
          <AnimatedButton
            label={t("todo.add")}
            onPress={handleAddTask}
            className="my-5 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
            textClassName="text-gray-100 text-center"
          />

          <View className=" items-center mb-10">
            <View className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
              <AppText
                className="mt-5 mb-10 text-xl text-center"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title || t("todo.myTodoListDefault")}
              </AppText>

              {todoList.map((item: TodoItem, index: number) => (
                <View
                  className="border border-gray-100 p-2 rounded-md flex-row justify-between items-center gap-2 bg-slate-900 mb-3"
                  key={item.tempId}
                >
                  <AppText
                    className="text-lg ml-2 mr-2 flex-1"
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.task}
                  </AppText>
                  <AnimatedButton
                    onPress={() => setOpen(index)}
                    className="bg-blue-500 p-1 rounded-md"
                  >
                    <SquareArrowOutUpRight size={20} color="#f3f4f6" />
                  </AnimatedButton>
                  {open === index && (
                    <FullScreenModal
                      onClose={() => {
                        setOpen(null);
                        setEdit(null);
                      }}
                      isOpen={true}
                    >
                      <PageContainer>
                        {edit === index ? (
                          <TouchableWithoutFeedback
                            onPress={Keyboard.dismiss}
                            accessible={false}
                          >
                            <View className="justify-between flex-1">
                              <ScrollView showsVerticalScrollIndicator={false}>
                                <View>
                                  <AppText className="my-5 text-2xl text-center">
                                    {t("todo.editTask")}
                                  </AppText>
                                  <View className="my-5 w-full">
                                    <AppInput
                                      placeholder={t(
                                        "todo.editTaskPlaceholder",
                                      )}
                                      label={t("todo.editTaskLabel")}
                                      value={modalDraft.task}
                                      setValue={(newTask) => {
                                        setModalDraft({
                                          ...modalDraft,
                                          task: newTask,
                                        });
                                      }}
                                    />
                                  </View>
                                  <SubNotesInput
                                    placeholder={t("todo.notesPlaceholder")}
                                    label={t("todo.addYourNotes")}
                                    value={modalDraft.notes}
                                    setValue={(newNotes) => {
                                      setModalDraft({
                                        ...modalDraft,
                                        notes: newNotes,
                                      });
                                    }}
                                  />
                                  <View className="mt-5">
                                    <MediaToolbar
                                      onRecordingComplete={(uri, durationMs) => {
                                        setTodoList((prev) =>
                                          prev.map((t, i) =>
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
                                        );
                                      }}
                                      onImageSelected={(uri) => {
                                        setTodoList((prev) =>
                                          prev.map((t, i) =>
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
                                        );
                                      }}
                                      onVideoSelected={(
                                        uri,
                                        thumbnailUri,
                                        durationMs,
                                      ) => {
                                        setTodoList((prev) =>
                                          prev.map((t, i) =>
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
                                        );
                                      }}
                                      currentImageCount={item.draftImages?.length ?? 0}
                                      currentVideoCount={item.draftVideos?.length ?? 0}
                                      currentVoiceCount={item.draftRecordings?.length ?? 0}
                                      showFolderButton={false}
                                      folders={[]}
                                      selectedFolderId={null}
                                      onFolderSelect={() => {}}
                                    />
                                  </View>
                                  {/* Show existing draft media for this task */}
                                  {(item.draftImages?.length ?? 0) > 0 && (
                                    <View className="mt-3">
                                      {item.draftImages?.map((image) => (
                                        <DraftImageItem
                                          key={image.id}
                                          uri={image.uri}
                                          onDelete={async () => {
                                            const confirmed =
                                              await confirmAction({
                                                title: t(
                                                  "todo.deleteMediaTitle",
                                                ),
                                                message: t(
                                                  "todo.deleteMediaMessage",
                                                ),
                                              });
                                            if (!confirmed) return;
                                            setTodoList((prev) =>
                                              prev.map((t, i) =>
                                                i === index
                                                  ? {
                                                      ...t,
                                                      draftImages:
                                                        t.draftImages?.filter(
                                                          (img) =>
                                                            img.id !== image.id,
                                                        ),
                                                    }
                                                  : t,
                                              ),
                                            );
                                          }}
                                        />
                                      ))}
                                    </View>
                                  )}
                                  {(item.draftVideos?.length ?? 0) > 0 && (
                                    <View className="mt-3">
                                      {item.draftVideos?.map((video) => (
                                        <DraftVideoItem
                                          key={video.id}
                                          uri={video.uri}
                                          thumbnailUri={video.thumbnailUri}
                                          durationMs={video.durationMs}
                                          onDelete={async () => {
                                            const confirmed =
                                              await confirmAction({
                                                title: t(
                                                  "todo.deleteMediaTitle",
                                                ),
                                                message: t(
                                                  "todo.deleteMediaMessage",
                                                ),
                                              });
                                            if (!confirmed) return;
                                            setTodoList((prev) =>
                                              prev.map((t, i) =>
                                                i === index
                                                  ? {
                                                      ...t,
                                                      draftVideos:
                                                        t.draftVideos?.filter(
                                                          (v) =>
                                                            v.id !== video.id,
                                                        ),
                                                    }
                                                  : t,
                                              ),
                                            );
                                          }}
                                        />
                                      ))}
                                    </View>
                                  )}
                                  {(item.draftRecordings?.length ?? 0) > 0 && (
                                    <View className="mt-3">
                                      {item.draftRecordings?.map((rec) => (
                                        <DraftRecordingItem
                                          key={rec.id}
                                          uri={rec.uri}
                                          durationMs={rec.durationMs}
                                          deleteRecording={async () => {
                                            const confirmed =
                                              await confirmAction({
                                                title: t(
                                                  "todo.deleteMediaTitle",
                                                ),
                                                message: t(
                                                  "todo.deleteMediaMessage",
                                                ),
                                              });
                                            if (!confirmed) return;
                                            setTodoList((prev) =>
                                              prev.map((t, i) =>
                                                i === index
                                                  ? {
                                                      ...t,
                                                      draftRecordings:
                                                        t.draftRecordings?.filter(
                                                          (r) =>
                                                            r.id !== rec.id,
                                                        ),
                                                    }
                                                  : t,
                                              ),
                                            );
                                          }}
                                        />
                                      ))}
                                    </View>
                                  )}
                                </View>
                              </ScrollView>
                              <View className="gap-5 mt-20">
                                <AnimatedButton
                                  label={t("common:common.save")}
                                  onPress={() => {
                                    setTodoList((list: TodoItem[]) =>
                                      list.map((item, i) =>
                                        i === index
                                          ? { ...item, ...modalDraft }
                                          : item,
                                      ),
                                    );
                                    setEdit(null);
                                  }}
                                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
                                  textClassName="text-gray-100 text-center"
                                />

                                <AnimatedButton
                                  label={t("common:common.cancel")}
                                  onPress={() => {
                                    setEdit(null);
                                    setModalDraft({ task: "", notes: "" });
                                  }}
                                  className="bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg "
                                  textClassName="text-gray-100 text-center"
                                />
                              </View>
                            </View>
                          </TouchableWithoutFeedback>
                        ) : (
                          <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="items-center">
                              <View className="relative items-center bg-slate-900 pt-5 pb-10 px-5 rounded-md shadow-md mt-5 w-full">
                                <AppText className="text-xl text-center mb-10 border-b border-gray-700 pb-2">
                                  {item.task}
                                </AppText>
                                <BodyText className="text-left">
                                  {item.notes || t("todo.noNotesAvailable")}
                                </BodyText>
                                {/* Show draft media in view mode */}
                                {(item.draftImages?.length ?? 0) > 0 && (
                                  <View className="mt-10 w-full">
                                    {item.draftImages?.map((image, idx) => (
                                      <DraftImageItem
                                        key={image.id}
                                        uri={image.uri}
                                        onPress={() => {
                                          setViewerItemId(item.tempId);
                                          setViewerIndex(idx);
                                        }}
                                      />
                                    ))}
                                  </View>
                                )}
                                {(item.draftVideos?.length ?? 0) > 0 && (
                                  <View className="mt-6 w-full">
                                    {item.draftVideos?.map((video) => (
                                      <DraftVideoItem
                                        key={video.id}
                                        uri={video.uri}
                                        thumbnailUri={video.thumbnailUri}
                                        durationMs={video.durationMs}
                                      />
                                    ))}
                                  </View>
                                )}
                                {(item.draftRecordings?.length ?? 0) > 0 && (
                                  <View className="mt-10 w-full">
                                    {item.draftRecordings?.map((rec) => (
                                      <DraftRecordingItem
                                        key={rec.id}
                                        uri={rec.uri}
                                        durationMs={rec.durationMs}
                                      />
                                    ))}
                                  </View>
                                )}
                              </View>
                              <View className="flex-row gap-5 mt-20">
                                <View className="w-1/2 flex-1">
                                  <AnimatedButton
                                    onPress={() => {
                                      setEdit(index);
                                      setModalDraft({
                                        task: item.task,
                                        notes: item.notes ?? "",
                                      });
                                    }}
                                    className="flex-row items-center justify-center gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
                                    textClassName="text-gray-100"
                                  >
                                    <AppText>{t("todo.edit")}</AppText>
                                    <SquarePen size={20} color="#f3f4f6" />
                                  </AnimatedButton>
                                </View>
                                <View className="w-1/2 flex-1">
                                  <AnimatedButton
                                    onPress={() => {
                                      handleDeleteItem(index);
                                    }}
                                    className="flex-row items-center justify-center gap-2 bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg"
                                    textClassName="text-gray-100"
                                  >
                                    <AppText>{t("todo.delete")}</AppText>
                                    <Trash2 size={20} color="#f3f4f6" />
                                  </AnimatedButton>
                                </View>
                              </View>
                            </View>
                          </ScrollView>
                        )}
                      </PageContainer>
                      {viewerItemId && getViewerImages().length > 0 && viewerIndex >= 0 && (
                        <ImageViewerModal
                          images={getViewerImages()}
                          initialIndex={viewerIndex}
                          visible={viewerIndex >= 0}
                          onClose={() => {
                            setViewerIndex(-1);
                            setViewerItemId(null);
                          }}
                        />
                      )}
                    </FullScreenModal>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="gap-5 flex-row">
          <View className="flex-1">
            <DeleteButton onPress={handleDeleteAll} />
          </View>
          <View className="flex-1">
            <SaveButton onPress={handleSaveTodo} />
          </View>
        </View>
        <FullScreenLoader
          visible={loading}
          message={t("todo.savingTodoList")}
        />
      </PageContainer>
    </ScrollView>
  );
}
