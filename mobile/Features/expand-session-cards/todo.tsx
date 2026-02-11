import { formatDate } from "@/lib/formatDate";
import { View, ScrollView, TouchableOpacity } from "react-native";
import AppText from "../../components/AppText";
import BodyText from "../../components/BodyText";
import AnimatedButton from "../../components/buttons/animatedButton";
import {
  Check,
  SquareArrowOutUpRight,
  Dot,
  ArrowDownUp,
} from "lucide-react-native";
import FullScreenModal from "../../components/FullScreenModal";
import SaveButton from "../../components/buttons/SaveButton";
import FullScreenLoader from "../../components/FullScreenLoader";
import { Checkbox } from "expo-checkbox";
import { checkedTodo } from "@/database/todo/check-todo";
import { full_todo_session, todo_tasks } from "@/types/models";
import { useState, useEffect, useRef, useCallback } from "react";
import Toast from "react-native-toast-message";
import DropDownModal from "../../components/DropDownModal";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import PageContainer from "../../components/PageContainer";
import CopyText from "../../components/CopyToClipboard";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";

type TodoSessionProps = {
  initialTodo: full_todo_session;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function TodoSession({
  initialTodo,
  onSave,
  onDirtyChange,
}: TodoSessionProps) {
  const { t } = useTranslation("todo");
  const [open, setOpen] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState(initialTodo);
  const [isSaving, setIsSaving] = useState(false);
  const [sortField, setSortField] = useState<"original" | "completed">(
    "original",
  );
  const [originalOrder, setOriginalOrder] = useState(initialTodo.todo_tasks);
  const lastSavedRef = useRef(initialTodo.todo_tasks);

  // Sync with initialTodo when it changes (after refetch)
  useEffect(() => {
    // Only update if there are no unsaved changes to avoid overwriting user edits
    const currentHasChanges =
      JSON.stringify(sessionData.todo_tasks) !==
      JSON.stringify(lastSavedRef.current);

    if (!currentHasChanges) {
      setSessionData(initialTodo);
      setOriginalOrder(initialTodo.todo_tasks);
      lastSavedRef.current = initialTodo.todo_tasks;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTodo]);

  const toggleCompleted = (taskId: string) => {
    setSessionData((prev) => {
      const updatedTasks = prev.todo_tasks.map((task) =>
        task.id === taskId
          ? { ...task, is_completed: !task.is_completed }
          : task,
      );
      return { ...prev, todo_tasks: updatedTasks };
    });
  };

  const handleDragEnd = ({ data }: { data: todo_tasks[] }) => {
    setSessionData((prev) => ({ ...prev, todo_tasks: data }));
  };

  const updated = new Date().toISOString();

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      const updatedFeedItem = await checkedTodo({
        updated_at: updated,
        list_id: sessionData.id,
        todo_tasks: sessionData.todo_tasks.map((task, index) => ({
          id: task.id ?? null,
          list_id: task.list_id,
          is_completed: task.is_completed,
          position: index,
        })),
      });

      // Update the baseline to match what was just saved
      lastSavedRef.current = sessionData.todo_tasks;
      setOriginalOrder(sessionData.todo_tasks);

      onSave(updatedFeedItem as FeedItemUI);
      Toast.show({
        type: "success",
        text1: t("todo.session.saveSuccess"),
      });
    } catch {
      Toast.show({ type: "error", text1: t("todo.session.saveError") });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData.todo_tasks) !==
    JSON.stringify(lastSavedRef.current);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const sortTodoByCompleted = () => {
    setSessionData((prev) => {
      const sortedTasks = [...prev.todo_tasks].sort((a, b) => {
        // Sort incomplete tasks first (false before true)
        if (a.is_completed === b.is_completed) return 0;
        return a.is_completed ? 1 : -1;
      });
      return { ...prev, todo_tasks: sortedTasks };
    });
  };

  const resetToOriginalOrder = () => {
    setSessionData((prev) => {
      const restoredTasks = originalOrder.map((originalTask) => {
        const currentTask = prev.todo_tasks.find(
          (t) => t.id === originalTask.id,
        );
        return currentTask || originalTask;
      });
      return { ...prev, todo_tasks: restoredTasks };
    });
  };

  const handleSortChange = (value: string) => {
    setSortField(value as "original" | "completed");
    if (value === "completed") {
      sortTodoByCompleted();
    } else {
      resetToOriginalOrder();
    }
  };

  const keyExtractor = useCallback(
    (item: todo_tasks, index: number) => `${item.id}-${index}`,
    [],
  );

  return (
    <View className="flex-1 pb-5">
      {hasChanges && (
        <View className="bg-slate-900 absolute top-5 left-5 z-50  py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? t("todo.session.unsavedChanges") : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="max-w-lg justify-between pt-5 pb-5 flex-1 px-1">
          <View className="items-center">
            <View className="mb-10 gap-2">
              <AppText className="text-sm text-gray-300">
                {t("todo.session.created")} {formatDate(sessionData.created_at)}
              </AppText>
              {sessionData.updated_at && (
                <AppText className="text-sm text-yellow-500">
                  {t("todo.session.updated")}{" "}
                  {formatDate(sessionData.updated_at)}
                </AppText>
              )}
            </View>
            <View className="bg-slate-950 rounded-xl pb-5 w-full">
              <View className="flex-row justify-between items-center my-5 gap-3 px-[30px] flex-1">
                <AppText
                  className="text-xl flex-1"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {sessionData.title}
                </AppText>
                <DropDownModal
                  label={t("todo.session.sortTasks")}
                  value={sortField}
                  onChange={handleSortChange}
                  options={[
                    {
                      value: "original",
                      label: t("todo.session.originalOrder"),
                    },
                    {
                      value: "completed",
                      label: t("todo.session.completedStatus"),
                    },
                  ]}
                  icon={<ArrowDownUp size={24} color="#9ca3af" />}
                />
              </View>

              <DraggableFlatList
                data={sessionData.todo_tasks}
                onDragEnd={handleDragEnd}
                keyExtractor={keyExtractor}
                scrollEnabled={false}
                renderItem={({
                  item: task,
                  drag,
                  isActive,
                }: RenderItemParams<todo_tasks>) => {
                  const taskIndex = sessionData.todo_tasks.findIndex(
                    (t) => t.id === task.id,
                  );
                  return (
                    <ScaleDecorator activeScale={1.07}>
                      <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={300}
                        activeOpacity={0.7}
                        style={{
                          opacity: isActive ? 0.8 : 1,
                        }}
                      >
                        <View className="flex-row gap-4 items-center mb-3">
                          <Checkbox
                            hitSlop={20}
                            onValueChange={() => {
                              toggleCompleted(task.id);
                            }}
                            value={task.is_completed}
                            className="bg-slate-800"
                          />
                          <View className="flex-row flex-1 items-center border border-gray-100 py-2 pl-1 rounded-md justify-between bg-slate-900">
                            <AppText
                              className="text-left mr-2 ml-1 flex-1"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {task.task}
                            </AppText>

                            <AnimatedButton
                              onPress={() => {
                                setOpen(taskIndex);
                              }}
                              className="bg-blue-500 p-1 rounded-md mr-2"
                              textClassName="text-gray-100"
                              hitSlop={10}
                              android_ripple={{ color: "#666" }}
                            >
                              <SquareArrowOutUpRight
                                size={20}
                                color="#f3f4f6"
                              />
                            </AnimatedButton>

                            {open === taskIndex && (
                              <FullScreenModal
                                onClose={() => {
                                  setOpen(null);
                                }}
                                isOpen={true}
                              >
                                <PageContainer className="mb-10">
                                  <AppText className="text-sm text-gray-300 text-center">
                                    {t("todo.session.created")}{" "}
                                    {formatDate(task.created_at!)}
                                  </AppText>
                                  {task.updated_at && (
                                    <AppText className="text-sm text-yellow-500 mt-2 text-center">
                                      {t("todo.session.updated")}{" "}
                                      {formatDate(task.updated_at)}
                                    </AppText>
                                  )}
                                  <View className="items-center bg-slate-900 pt-5 pb-10 px-5 rounded-md shadow-md mt-5">
                                    <AppText className="text-xl text-center mb-10 border-b border-gray-700 pb-2">
                                      {task.task}
                                    </AppText>
                                    <BodyText className="text-left">
                                      {task.notes || t("todo.noNotesAvailable")}
                                    </BodyText>
                                  </View>
                                  <View className="mt-10">
                                    <CopyText
                                      textToCopy={
                                        task.task + "\n\n" + task.notes || ""
                                      }
                                    />
                                  </View>
                                </PageContainer>
                              </FullScreenModal>
                            )}
                          </View>
                          {task.is_completed && (
                            <View
                              className="absolute pointer-events-none bg-gray-400/30 rounded-md items-center justify-center"
                              style={{
                                left: -7,
                                right: -7,
                                top: -4,
                                bottom: -4,
                              }}
                            >
                              <Check size={50} color="#15803d" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </ScaleDecorator>
                  );
                }}
                contentContainerStyle={{
                  paddingBottom: 10,
                  paddingHorizontal: 20,
                  paddingTop: 10,
                }}
              />
            </View>
          </View>
          <View className="mt-10 px-4">
            <SaveButton
              onPress={saveChanges}
              disabled={!hasChanges}
              label={
                !hasChanges
                  ? t("todo.session.save")
                  : t("todo.session.saveChanges")
              }
            />
          </View>
          <FullScreenLoader
            visible={isSaving}
            message={t("todo.session.savingChanges")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
