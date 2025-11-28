import { useState } from "react";
import SaveButton from "../buttons/SaveButton";
import FullScreenLoader from "../FullScreenLoader";
import Toast from "react-native-toast-message";
import { full_todo_session } from "../../types/models";
import { editTodo } from "@/api/todo/edit-todo";
import SubNotesInput from "../SubNotesInput";
import AppInput from "../AppInput";
import AnimatedButton from "../buttons/animatedButton";
import { randomUUID } from "expo-crypto";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import PageContainer from "../PageContainer";
import { confirmAction } from "@/lib/confirmAction";

type Props = {
  todo_session: full_todo_session;
  onClose: () => void;
  onSave?: () => void;
};

type Task = {
  task: string;
  notes: string;
};

export default function EditTodo({ todo_session, onClose, onSave }: Props) {
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
          id: randomUUID(),
          task: "",
          notes: "",
          created_at: new Date().toISOString(),
          is_completed: false,
          list_id: prev.id,
          user_id: prev.user_id,
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

      if (updatedTasks?.id) setDeletedIds((ids) => [...ids, updatedTasks.id]);

      const todo_tasks = prev.todo_tasks.filter((_, i) => i !== index);
      return { ...prev, todo_tasks };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await editTodo({
        id: sessionData.id,
        title: sessionData.title,
        tasks: sessionData.todo_tasks.map((task) => ({
          id: task.id,
          task: task.task,
          notes: task.notes ?? undefined,
        })),
        deletedIds,
      });

      Toast.show({
        type: "success",
        text1: "Session updated successfully",
      });
      await onSave?.();
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to update session",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer className="justify-between items-center gap-5 max-w-lg">
        <View className="w-full">
          <AppText className="text-lg text-center mb-10">
            Edit your todo lists
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
                    placeholder="Todo notes..."
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
          <SaveButton onPress={handleSave} label="Save" />
        </View>
      </PageContainer>

      <FullScreenLoader visible={isSaving} message="Saving todo list..." />
    </ScrollView>
  );
}
