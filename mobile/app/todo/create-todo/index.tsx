import { ListTodo } from "lucide-react-native";
import { useState } from "react";
import { nanoid } from "nanoid/non-secure";
import DeleteButton from "@/components/buttons/DeleteButton";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { saveTodoToDB } from "@/database/todo/save-todo";
import AppInput from "@/components/AppInput";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConfirmAction } from "@/lib/confirmAction";
import PageContainer from "@/components/PageContainer";
import { View, Pressable, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft, { TodoItem } from "@/features/todo/hooks/useSaveDraft";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";
import TodoTaskCard from "@/features/todo/components/TodoTaskCard";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function CreateTodo() {
  const { t } = useTranslation(["todo", "common"]);
  const now = formatDateShort(new Date());

  const [loading, setLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState(`${t("todo.title")} - ${now}`);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [viewerTaskIndex, setViewerTaskIndex] = useState<number | null>(null);

  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();

  useSaveDraft({ title, todoList, setTitle, setTodoList });

  const handleDeleteItem = async (index: number) => {
    const confirmed = await confirmAction({
      title: t("todo.deleteTaskTitle"),
      message: t("todo.deleteTaskMessage"),
    });
    if (!confirmed) return;

    setTodoList((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  const handleDeleteAll = () => {
    AsyncStorage.removeItem("todo_draft");
    setTodoList([]);
    setTitle("");
    setExpandedIndex(null);
  };

  const handleAddTask = () => {
    const newIndex = todoList.length;
    setTodoList((prev) => [
      ...prev,
      { tempId: nanoid(), task: "", notes: null },
    ]);
    setExpandedIndex(newIndex);
  };

  const handleSaveTodo = async () => {
    if (todoList.some((task) => task.draftVideos?.some((v) => v.isCompressing))) {
      Toast.show({ type: "info", text1: t("common:common.media.videoStillCompressing") });
      return;
    }
    if (!title.trim()) {
      Toast.show({ type: "error", text1: t("todo.emptyTitleError") });
      return;
    }
    if (todoList.length === 0) {
      Toast.show({ type: "error", text1: t("todo.emptyListError") });
      return;
    }
    const hasEmptyTasks = todoList.some((item) => item.task.trim() === "");
    if (hasEmptyTasks) {
      Toast.show({
        type: "error",
        text1: t("todo.editScreen.emptyTasksError"),
        text2: t("todo.editScreen.emptyTasksErrorSub"),
      });
      return;
    }
    setLoading(true);
    setSavingProgress(undefined);
    try {
      await saveTodoToDB({ title, todoList, onProgress: setSavingProgress });
      await queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
      await queryClient.invalidateQueries({ queryKey: ["myTodoLists"] });
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

  const updateTask = (
    index: number,
    updates: Partial<TodoItem> | ((task: TodoItem) => Partial<TodoItem>),
  ) => {
    setTodoList((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const resolved =
          typeof updates === "function" ? updates(item) : updates;
        return { ...item, ...resolved };
      }),
    );
  };

  const getViewerImages = (taskIndex: number) => {
    const item = todoList[taskIndex];
    return (item?.draftImages ?? []).map((img) => ({
      id: img.id,
      uri: img.uri,
    }));
  };

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <PageContainer className="justify-between">
            <View>
              <View className="flex-row items-center gap-2 justify-center mb-10">
                <AppText className="text-2xl">{t("todo.todoList")}</AppText>
                <ListTodo color="#f3f4f6" size={30} />
              </View>

              <View className="mb-5">
                <AppInput
                  placeholder={t("todo.titlePlaceholder")}
                  label={t("todo.addTitleLabel")}
                  value={title}
                  setValue={setTitle}
                />
              </View>

              {todoList.map((item, index) => (
                <TodoTaskCard
                  key={item.tempId}
                  index={index}
                  task={item.task}
                  notes={item.notes ?? ""}
                  isExpanded={expandedIndex === index}
                  onToggleExpand={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                  onTaskChange={(value) => updateTask(index, { task: value })}
                  onNotesChange={(value) =>
                    updateTask(index, { notes: value })
                  }
                  onDelete={() => handleDeleteItem(index)}
                  draftImages={item.draftImages}
                  draftVideos={item.draftVideos}
                  draftRecordings={item.draftRecordings}
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
                      draftImages: (t.draftImages ?? []).filter(
                        (img) => img.id !== id,
                      ),
                    }))
                  }
                  onDeleteDraftVideo={(id) =>
                    updateTask(index, (t) => ({
                      draftVideos: (t.draftVideos ?? []).filter(
                        (v) => v.id !== id,
                      ),
                    }))
                  }
                  onDeleteDraftRecording={(id) =>
                    updateTask(index, (t) => ({
                      draftRecordings: (t.draftRecordings ?? []).filter(
                        (r) => r.id !== id,
                      ),
                    }))
                  }
                  onImagePress={(imgIdx) => {
                    setViewerTaskIndex(index);
                    setViewerIndex(imgIdx);
                  }}
                />
              ))}
            </View>

            <View className="gap-5 mt-10">
              <AnimatedButton
                label={t("todo.editScreen.addTask")}
                onPress={handleAddTask}
                className="btn-base py-2"
                textClassName="text-gray-100 text-center"
              />
              <View className="flex-row gap-5">
              <View className="flex-1">
                <DeleteButton onPress={handleDeleteAll} />
              </View>
              <View className="flex-1">
                <SaveButton onPress={handleSaveTodo} />
              </View>
              </View>
            </View>

            <FullScreenLoader
              visible={loading}
              message={savingProgress !== undefined ? t("common:common.media.uploading") : t("todo.savingTodoList")}
              progress={savingProgress}
            />
          </PageContainer>
        </Pressable>
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
