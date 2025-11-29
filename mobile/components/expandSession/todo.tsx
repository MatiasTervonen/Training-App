import { formatDate } from "@/lib/formatDate";
import { View } from "react-native";
import AppText from "../AppText";
import AnimatedButton from "../buttons/animatedButton";
import { Check, SquareArrowOutUpRight } from "lucide-react-native";
import FullScreenModal from "../FullScreenModal";
import SaveButton from "../buttons/SaveButton";
import FullScreenLoader from "../FullScreenLoader";
import { Checkbox } from "expo-checkbox";
import { checkedTodo } from "@/api/todo/check-todo";
import { full_todo_session } from "@/types/models";
import { useState } from "react";
import Toast from "react-native-toast-message";

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

  const toggleCompleted = (index: number) => {
    setSessionData((prev) => {
      const updatedTasks = [...prev.todo_tasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        is_completed: !updatedTasks[index].is_completed,
      };
      return { ...prev, todo_tasks: updatedTasks };
    });
  };

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      await checkedTodo({
        todo_tasks: sessionData.todo_tasks.map((task) => ({
          id: task.id,
          list_id: task.list_id,
          task: task.task,
          is_completed: task.is_completed,
        })),
      });

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
    JSON.stringify(initialTodo.todo_tasks);

  return (
    <View className="max-w-lg justify-between pt-5 pb-10 flex-1 px-2">
      <View className="items-center">
        <AppText className="text-sm text-gray-400 mb-10">
          created at: {formatDate(sessionData.created_at)}
        </AppText>
        {sessionData.updated_at && (
          <AppText className="text-sm text-gray-400 mb-10">
            updated at: {formatDate(sessionData.updated_at)}
          </AppText>
        )}
        <View className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
          <AppText className="my-5 text-xl wrap-break-word text-center">
            {sessionData.title}
          </AppText>

          <View className="gap-3">
            {sessionData.todo_tasks.map((task, index) => {
              return (
                <View key={task.id} className="flex-row gap-4 items-center">
                  <Checkbox
                    hitSlop={10}
                    onValueChange={() => {
                      toggleCompleted(index);
                    }}
                    value={task.is_completed}
                    className="bg-slate-800 "
                  />
                  <View className="flex-row flex-1 items-center border border-gray-100 p-2 rounded-md justify-between bg-slate-900">
                    <AppText
                      className="text-left mr-2 ml-2 text-lg flex-1"
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {task.task}
                    </AppText>

                    <AnimatedButton
                      onPress={() => setOpen(index)}
                      className="bg-blue-500 p-1 rounded-md "
                      textClassName="text-gray-100"
                    >
                      <SquareArrowOutUpRight size={20} color="#f3f4f6" />
                    </AnimatedButton>

                    {open === index && (
                      <FullScreenModal
                        onClose={() => {
                          setOpen(null);
                        }}
                        isOpen={true}
                      >
                        <View className="flex flex-col max-w-lg mx-auto mt-10 px-5">
                          <AppText className="text-2xl mb-10 wrap-break-word text-center">
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
                      className="absolute  pointer-events-none bg-gray-400/30 rounded-md items-center"
                      style={{
                        left: -20,
                        right: -20,
                      }}
                    >
                      <Check size={50} color="#15803d" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View className="mt-10">
        <SaveButton
          onPress={saveChanges}
          disabled={!hasChanges}
          label={!hasChanges ? "No changes" : "Save changes"}
        />
      </View>
      <FullScreenLoader visible={isSaving} message="Saving changes..." />
    </View>
  );
}
