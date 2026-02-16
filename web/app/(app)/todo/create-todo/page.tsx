"use client";

import {
  ListTodo,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import Modal from "@/components/modal";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import TitleInput from "@/ui/TitleInput";
import SubNotesInput from "@/ui/SubNotesInput";
import useSaveDraft from "@/features/todo/hooks/useSaveDraft";
import useDeleteItem from "@/features/todo/hooks/useDeleteItem";
import useSaveTodo from "@/features/todo/hooks/useSaveTodo";

type TodoItem = {
  task: string;
  notes: string | null;
};

export default function Todo() {
  const { t } = useTranslation("todo");
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
  const [isLoaded, setIsLoaded] = useState(false);

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

  // useDeleteItem hook to delete item from todo list
  const { handleDeleteItem } = useDeleteItem({
    todoList,
    setTodoList,
  });

  const handleDeleteAll = () => {
    localStorage.removeItem("todo_draft");
    setTodoList([]);
    setTask("");
    setNotes("");
    setTitle("");
  };

  // useSaveTodo hook to save todo list

  const { handleSaveTodo, isSaving } = useSaveTodo({ title, todoList, onSuccess: handleDeleteAll });

  return (
    <div className="flex flex-col justify-between min-h-full max-w-md mx-auto page-padding">
      <div>
        <div className="flex items-center gap-5 justify-center mb-10">
          <h1 className="text-2xl">{t("todo.todoList")} </h1>
          <ListTodo color="#f3f4f6" size={30} />
        </div>
        <TitleInput
          placeholder={t("todo.titlePlaceholder")}
          label={t("todo.addTitleLabel")}
          value={title}
          setValue={setTitle}
        />
        <div className="mt-5">
          <TitleInput
            placeholder={t("todo.taskPlaceholder")}
            label={t("todo.addTaskLabel")}
            value={task}
            setValue={setTask}
          />
        </div>
        <div className="mt-5">
          <SubNotesInput
            placeholder={t("todo.notesPlaceholder")}
            label={t("todo.addNotesLabel")}
            notes={notes}
            setNotes={setNotes}
          />
        </div>
        <button
          onClick={() => {
            if (task.trim() === "") return;
            setTodoList([...todoList, { task, notes }]);
            setNotes("");
            setTask("");
          }}
          className=" my-5 flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
        >
          {t("todo.add")}
        </button>
        <div className="flex flex-col items-center my-10">
          <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
            <h2 className="my-10 text-2xl text-center wrap-break-word line-clamp-2">
              {title || t("todo.myTodoListDefault")}
            </h2>
            <ul className="flex flex-col gap-5">
              {todoList.map((item: TodoItem, index: number) => (
                <li
                  className=" text-lg border p-2 rounded-md flex justify-between gap-2 bg-slate-900"
                  key={index}
                >
                  <p className="overflow-hidden wrap-break-word line-clamp-2">
                    {item.task}
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setOpen(index)}
                      className="bg-blue-500 px-1 rounded-md hover:bg-blue-400"
                    >
                      <SquareArrowOutUpRight size={20} />
                    </button>
                  </div>
                  {open === index && (
                    <Modal
                      onClose={() => {
                        setOpen(null);
                        setEdit(null);
                      }}
                      isOpen={true}
                    >
                      <div className="flex flex-col justify-center items-center max-w-lg mx-auto px-5">
                        {edit === index ? (
                          <>
                            <h3 className="my-5 text-2xl">{t("todo.editTask")}</h3>
                            <div className="my-10 w-full">
                              <TitleInput
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
                            </div>
                            <div className="w-full">
                              <SubNotesInput
                                placeholder={t("todo.notesPlaceholder")}
                                label={t("todo.addYourNotes")}
                                notes={modalDraft.notes}
                                setNotes={(newNotes) => {
                                  setModalDraft({
                                    ...modalDraft,
                                    notes: newNotes,
                                  });
                                }}
                              />
                            </div>
                            <div className="w-full flex gap-5 mt-20">
                              <button
                                onClick={() => {
                                  setTodoList((list: TodoItem[]) =>
                                    list.map((item, i) =>
                                      i === index
                                        ? { ...item, ...modalDraft }
                                        : item
                                    )
                                  );
                                  setEdit(null);
                                }}
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>{t("common:common.save")}</p>
                              </button>
                              <button
                                onClick={() => {
                                  setEdit(null);
                                  setModalDraft({ task: "", notes: "" });
                                }}
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>{t("common:common.cancel")}</p>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div>
                            <h3 className=" text-2xl my-10 w-full wrap-break-word overflow-hidden text-center max-w-lg">
                              {item.task}
                            </h3>
                            <p className="text-gray-400 w-full wrap-break-word overflow-hidden text-center">
                              {item.notes || t("todo.noNotesAvailable")}
                            </p>
                            <div className="flex w-full gap-5 mt-20">
                              <button
                                onClick={() => {
                                  setEdit(index);
                                  setModalDraft({
                                    task: item.task,
                                    notes: item.notes ?? "",
                                  });
                                }}
                                className="w-[130px] flex items-center justify-center px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>{t("todo.edit")}</p>
                                <SquarePen size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteItem(index);
                                }}
                                className="w-[130px] flex items-center justify-center px-4 gap-2  bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>{t("todo.delete")}</p>
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Modal>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-5">
        <DeleteSessionBtn onDelete={handleDeleteAll} />
        <SaveButton
          onClick={() => {
            handleSaveTodo();
          }}
        />
      </div>
      {isSaving && <FullScreenLoader message={t("todo.savingTodoList")} />}
    </div>
  );
}
