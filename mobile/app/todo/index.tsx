import {
  ListTodo,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
} from "lucide-react-native";
import { useState } from "react";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenModal from "@/components/FullScreenModal";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import saveTodoToDB from "@/database/todo/save-todo";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmAction } from "@/lib/confirmAction";
import PageContainer from "@/components/PageContainer";
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/hooks/todo/useSaveDraft";

type TodoItem = {
  task: string;
  notes: string | null;
};

export default function Todo() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [task, setTask] = useState("");
  const [notes, setNotes] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<{ task: string; notes: string }>(
    {
      task: "",
      notes: "",
    }
  );
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  const queryClient = useQueryClient();

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
    setIsLoaded,
    isLoaded,
  });

  const handleDeleteItem = async (index: number) => {
    const confirmDelete = await confirmAction({
      title: "Delete task",
      message: "Are you sure you want to delete this task?",
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
  };

  const handleSaveTodo = async () => {
    setLoading(true);
    try {
      await saveTodoToDB({ title, todoList });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      router.push("/dashboard");
      handleDeleteAll();
      Toast.show({
        type: "success",
        text1: "Todo saved successfully",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save todo",
      });
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer className="justify-between">
        <View>
          <View className="flex-row items-center gap-2 justify-center mb-10">
            <AppText className="text-2xl">Todo List </AppText>
            <ListTodo color="#f3f4f6" size={30} />
          </View>
          <AppInput
            placeholder="Title"
            label="Add title to your todo list"
            value={title}
            setValue={setTitle}
          />
          <View className="mt-5">
            <AppInput
              placeholder="Enter task..."
              label="Add task to your todo list"
              value={task}
              setValue={setTask}
            />
          </View>
          <View className="mt-5">
            <SubNotesInput
              className="min-h-[60px]"
              placeholder="Enter notes...(optional)"
              label="Add notes to your task"
              value={notes}
              setValue={setNotes}
            />
          </View>
          <AnimatedButton
            label="Add"
            onPress={() => {
              if (task.trim() === "") return;
              setTodoList([...todoList, { task, notes }]);
              setNotes("");
              setTask("");
            }}
            className="my-5 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
            textClassName="text-gray-100 text-center"
          />

          <View className=" items-center mb-10">
            <View className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
              <AppText
                className="my-10 text-2xl text-center"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title || "My Todo List"}
              </AppText>

              {todoList.map((item: TodoItem, index: number) => (
                <View
                  className="border border-gray-100 p-2 rounded-md flex-row justify-between items-center gap-2 bg-slate-900 mb-3"
                  key={index}
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
                              <View>
                                <AppText className="my-5 text-2xl text-center">
                                  Edit Task
                                </AppText>
                                <View className="my-5 w-full">
                                  <AppInput
                                    placeholder="Edit task..."
                                    label="Edit your task"
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
                                  className="min-h-[60px]"
                                  placeholder="Enter notes...(optional)"
                                  label="Add your notes"
                                  value={modalDraft.notes}
                                  setValue={(newNotes) => {
                                    setModalDraft({
                                      ...modalDraft,
                                      notes: newNotes,
                                    });
                                  }}
                                />
                              </View>
                              <View className="gap-5 mt-20">
                                <AnimatedButton
                                  label="Save"
                                  onPress={() => {
                                    setTodoList((list: TodoItem[]) =>
                                      list.map((item, i) =>
                                        i === index
                                          ? { ...item, ...modalDraft }
                                          : item
                                      )
                                    );
                                    setEdit(null);
                                  }}
                                  className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg"
                                  textClassName="text-gray-100 text-center"
                                />

                                <AnimatedButton
                                  label="Cancel"
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
                          <View className="items-center">
                            <AppText className=" text-2xl my-10 text-center">
                              {item.task}
                            </AppText>
                            <AppText className="text-gray-300 text-lg bg-slate-900 p-10 rounded-md text-left w-full">
                              {item.notes || "No notes available"}
                            </AppText>
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
                                  <AppText>edit</AppText>
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
                                  <AppText>delete</AppText>
                                  <Trash2 size={20} color="#f3f4f6" />
                                </AnimatedButton>
                              </View>
                            </View>
                          </View>
                        )}
                      </PageContainer>
                    </FullScreenModal>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="gap-5">
          <SaveButton onPress={handleSaveTodo} />
          <DeleteButton onPress={handleDeleteAll} />
        </View>
        <FullScreenLoader visible={loading} message="Saving todolist..." />
      </PageContainer>
    </ScrollView>
  );
}
