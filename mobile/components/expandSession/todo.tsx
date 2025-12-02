import { formatDate } from "@/lib/formatDate";
import { View, ScrollView } from "react-native";
import AppText from "../AppText";
import AnimatedButton from "../buttons/animatedButton";
import { Check, SquareArrowOutUpRight, Dot } from "lucide-react-native";
import FullScreenModal from "../FullScreenModal";
import SaveButton from "../buttons/SaveButton";
import FullScreenLoader from "../FullScreenLoader";
import { Checkbox } from "expo-checkbox";
import { checkedTodo } from "@/database/todo/check-todo";
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

  // const sortTask = sessionData.todo_tasks.sort((a, b) => {
  //   return Number(a.is_completed) - Number(b.is_completed);
  // });

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
                <AppText className="text-sm text-gray-300">
                  updated: {formatDate(sessionData.updated_at)}
                </AppText>
              )}
            </View>
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
                          onPress={() => setOpen(index)}
                          className="bg-blue-500 p-1 rounded-md mr-2"
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
