import { useState } from "react";
import SaveButton from "../../components/buttons/SaveButton";
import FullScreenLoader from "../../components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { full_todo_session_optional_id } from "../../types/models";
import { editTodo } from "@/database/todo/edit-todo";
import SubNotesInput from "../../components/SubNotesInput";
import AppInput from "../../components/AppInput";
import AnimatedButton from "../../components/buttons/animatedButton";
import { View, ScrollView } from "react-native";
import AppText from "../../components/AppText";
import PageContainer from "../../components/PageContainer";
import { confirmAction } from "@/lib/confirmAction";
import { Dot } from "lucide-react-native";
import { FeedItemUI } from "@/types/session";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave?: (updateFeedItem: FeedItemUI) => void;
};

type Task = {
  task: string;
  notes?: string;
  position: number;
  updated_at: string;
};

export default function EditTodo({ todo_session, onClose, onSave }: Props) {
  const [originalData] = useState(todo_session);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState(todo_session);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

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
          id: null,
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
      title: "Delete task",
      message: "Are you sure you want to delete this task ?",
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
      (task) => task.task.trim().length === 0
    );

    if (hasEmptyTasks) {
      Toast.show({
        type: "error",
        text1: "You have empty tasks.",
        text2: "Fill or delete all empty tasks before saving.",
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
        })),
        deletedIds,
        updated_at: updated,
      });

      await onSave?.(updatedFeedItem);
      onClose();
      Toast.show({
        type: "success",
        text1: "Session updated successfully",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to update session",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData) !== JSON.stringify(originalData);

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50  py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? "unsaved changes" : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <PageContainer className="justify-between items-center gap-5 max-w-lg mb-5">
          <View className="w-full">
            <AppText className="text-lg text-center mb-10">
              Edit your todo list
            </AppText>
            <View className="w-full mb-10">
              <AppInput
                value={sessionData.title}
                setValue={handleTitleChange}
                placeholder="Todo title..."
                label="Title..."
              />
            </View>
            <View className="w-full">
              {sessionData.todo_tasks.map((task, index) => (
                <View
                  key={task.id}
                  className="text-gray-300 mb-5 bg-slate-900 p-4 rounded-lg"
                >
                  <View className="flex-row justify-between">
                    <AppText className="mb-2">{index + 1}.</AppText>
                    <AnimatedButton
                      onPress={() => handleDeleteItem(index)}
                      label="Delete"
                      textClassName="text-red-500"
                    />
                  </View>
                  <AppInput
                    value={task.task}
                    setValue={(value) => updateTask(index, { task: value })}
                    placeholder="Todo title..."
                    label="Task..."
                  />
                  <View className="mt-5">
                    <SubNotesInput
                      value={task.notes || ""}
                      setValue={(value) => updateTask(index, { notes: value })}
                      className="min-h-[60px]"
                      placeholder="Todo notes (optional)"
                      label="Notes..."
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View className="w-full pt-10 flex flex-col gap-5">
            <AnimatedButton
              onPress={addNewTask}
              label="Add Task"
              className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
              textClassName="text-gray-100 text-center"
            />
            <SaveButton
              disabled={!hasChanges}
              onPress={handleSave}
              label={!hasChanges ? "Save" : "Save Changes"}
            />
          </View>
        </PageContainer>

        <FullScreenLoader visible={isSaving} message="Saving todo list..." />
      </ScrollView>
    </View>
  );
}
