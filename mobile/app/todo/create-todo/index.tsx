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
import AnimatedButton from "@/components/buttons/animatedButton";
import useSaveDraft from "@/features/todo/hooks/useSaveDraft";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";

type TodoItem = {
  tempId: string;
  task: string;
  notes: string | null;
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
        exact: true,
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
          </View>
          <AnimatedButton
            label={t("todo.add")}
            onPress={() => {
              if (task.trim() === "") return;
              setTodoList((prev) => [...prev, { tempId: nanoid(), task, notes }]);
              setNotes("");
              setTask("");
            }}
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
                              <View>
                                <AppText className="my-5 text-2xl text-center">
                                  {t("todo.editTask")}
                                </AppText>
                                <View className="my-5 w-full">
                                  <AppInput
                                    placeholder={t("todo.editTaskPlaceholder")}
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
                              </View>
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
                          <View className="items-center">
                            <AppText className=" text-2xl my-10 text-center">
                              {item.task}
                            </AppText>
                            <AppText className="text-gray-300 text-lg bg-slate-900 p-10 rounded-md text-left w-full">
                              {item.notes || t("todo.noNotesAvailable")}
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
                        )}
                      </PageContainer>
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
