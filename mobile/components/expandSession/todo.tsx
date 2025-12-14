import { formatDate } from "@/lib/formatDate";
import { View, ScrollView, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import AnimatedButton from "../buttons/animatedButton";
import {
  Check,
  SquareArrowOutUpRight,
  Dot,
  ArrowDownUp,
} from "lucide-react-native";
import FullScreenModal from "../FullScreenModal";
import SaveButton from "../buttons/SaveButton";
import FullScreenLoader from "../FullScreenLoader";
import { Checkbox } from "expo-checkbox";
import { checkedTodo } from "@/database/todo/check-todo";
import { full_todo_session, todo_tasks } from "@/types/models";
import { useState, useEffect, useRef, useCallback } from "react";
import Toast from "react-native-toast-message";
import DropDownModal from "../DropDownModal";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

type TodoSessionProps = {
  initialTodo: full_todo_session;
  mutateFullTodoSession: () => Promise<void>;
};

export default function TodoSession({
  initialTodo,
  mutateFullTodoSession,
}: TodoSessionProps) {
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
      await checkedTodo({
        updated_at: updated,
        listId: sessionData.id,
        todo_tasks: sessionData.todo_tasks.map((task, index) => ({
          id: task.id,
          list_id: task.list_id,
          task: task.task,
          is_completed: task.is_completed,
          position: index,
        })),
      });

      // Update the baseline to match what was just saved
      lastSavedRef.current = sessionData.todo_tasks;
      setOriginalOrder(sessionData.todo_tasks);

      await mutateFullTodoSession();
      Toast.show({
        type: "success",
        text1: "Changes saved successfully",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to save changes" });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData.todo_tasks) !==
    JSON.stringify(lastSavedRef.current);

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
            {hasChanges ? "unsaved changes" : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="max-w-lg justify-between pt-5 pb-10 flex-1 px-2">
          <View className="items-center">
            <View className="mb-10 gap-2">
              <AppText className="text-sm text-gray-300">
                created: {formatDate(sessionData.created_at)}
              </AppText>
              {sessionData.updated_at && (
                <AppText className="text-sm text-yellow-500">
                  updated: {formatDate(sessionData.updated_at)}
                </AppText>
              )}
            </View>
            <View className="bg-slate-950  rounded-xl pb-5 w-full">
              <View className="flex-row justify-between items-center my-5 gap-3 px-4 flex-1">
                <AppText
                  className="text-xl flex-1"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {sessionData.title}
                </AppText>
                <DropDownModal
                  label="Sort tasks"
                  value={sortField}
                  onChange={handleSortChange}
                  options={[
                    { value: "original", label: "Original Order" },
                    { value: "completed", label: "Completed Status" },
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
                    <ScaleDecorator>
                      <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={300}
                        activeOpacity={0.7}
                        style={{
                          opacity: isActive ? 0.8 : 1,
                        }}
                      >
                        <View
                          className="flex-row gap-4 items-center mb-3"
                          style={{ position: "relative" }}
                        >
                          <Checkbox
                            hitSlop={10}
                            onValueChange={() => {
                              toggleCompleted(task.id);
                            }}
                            value={task.is_completed}
                            className="bg-slate-800"
                          />
                          <View className="flex-row flex-1 items-center border border-gray-100 py-2 pl-2 rounded-md justify-between bg-slate-900">
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
                                <View className="flex flex-col max-w-lg mx-auto mt-10 px-5">
                                  <AppText className="text-xl mb-10 wrap-break-word text-center">
                                    {task.task}
                                  </AppText>
                                  <AppText className="bg-slate-900 p-10 whitespace-pre-wrap wrap-break-word rounded-md text-left">
                                    {task.notes || "No notes available"}
                                  </AppText>
                                </View>
                              </FullScreenModal>
                            )}
                          </View>
                          {task.is_completed && (
                            <View
                              className="absolute pointer-events-none bg-gray-400/30 rounded-md items-center justify-center"
                              style={{
                                left: -12,
                                right: -12,
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
                  paddingHorizontal: 30,
                  paddingTop: 10,
                }}
              />
            </View>
          </View>
          <View className="mt-10 px-4">
            <SaveButton
              onPress={saveChanges}
              disabled={!hasChanges}
              label={!hasChanges ? "Save" : "Save Changes"}
            />
          </View>
          <FullScreenLoader visible={isSaving} message="Saving changes..." />
        </View>
      </ScrollView>
    </View>
  );
}
