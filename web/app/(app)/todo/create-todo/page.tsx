"use client";

import { ListTodo, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import TitleInput from "@/ui/TitleInput";
import SubNotesInput from "@/ui/SubNotesInput";
import useSaveDraft from "@/features/todo/hooks/useSaveDraft";
import useSaveTodo from "@/features/todo/hooks/useSaveTodo";
import { formatDateShort } from "@/lib/formatDate";

type TodoItem = {
  task: string;
  notes: string | null;
};

export default function Todo() {
  const { t } = useTranslation(["todo", "common"]);
  const now = formatDateShort(new Date());

  const [title, setTitle] = useState(`${t("todo:todo.title")} - ${now}`);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useSaveDraft({
    title,
    task: "",
    notes: "",
    todoList,
    setTitle,
    setTask: () => {},
    setNotes: () => {},
    setTodoList,
    setIsLoaded,
    isLoaded,
  });

  const handleDeleteItem = (index: number) => {
    const confirmed = window.confirm(t("todo:todo.deleteTaskMessage"));
    if (!confirmed) return;
    setTodoList((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  const handleDeleteAll = () => {
    localStorage.removeItem("todo_draft");
    setTodoList([]);
    setTitle("");
    setExpandedIndex(null);
  };

  const handleAddTask = () => {
    const newIndex = todoList.length;
    setTodoList((prev) => [...prev, { task: "", notes: null }]);
    setExpandedIndex(newIndex);
  };

  const updateTask = (index: number, updates: Partial<TodoItem>) => {
    setTodoList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const { handleSaveTodo, isSaving } = useSaveTodo({
    title,
    todoList,
    onSuccess: handleDeleteAll,
  });

  return (
    <div className="flex flex-col justify-between min-h-full max-w-md mx-auto page-padding">
      <div>
        <div className="flex items-center gap-3 justify-center mb-10">
          <h1 className="text-2xl">{t("todo:todo.todoList")}</h1>
          <ListTodo color="#f3f4f6" size={30} />
        </div>

        <div className="mb-5">
          <TitleInput
            placeholder={t("todo:todo.titlePlaceholder")}
            label={t("todo:todo.addTitleLabel")}
            value={title}
            setValue={setTitle}
          />
        </div>

        {/* Task cards */}
        <div className="flex flex-col gap-3">
          {todoList.map((item, index) => {
            const isExpanded = expandedIndex === index;

            if (!isExpanded) {
              return (
                <button
                  key={index}
                  onClick={() => setExpandedIndex(index)}
                  className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center cursor-pointer hover:bg-white/8 transition-colors"
                >
                  <span className="mr-2">{index + 1}.</span>
                  <span
                    className={`flex-1 text-left line-clamp-1 font-body ${item.task ? "text-gray-100" : "text-gray-500"}`}
                  >
                    {item.task || t("todo:todo.taskPlaceholder")}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
              );
            }

            return (
              <div
                key={index}
                className="bg-white/5 border border-white/10 p-4 rounded-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <span>{index + 1}.</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="text-red-500 cursor-pointer hover:text-red-400"
                    >
                      {t("todo:todo.editScreen.delete")}
                    </button>
                    <button
                      onClick={() => setExpandedIndex(null)}
                      className="cursor-pointer"
                    >
                      <ChevronUp size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <TitleInput
                  value={item.task}
                  setValue={(value) => updateTask(index, { task: value })}
                  placeholder={t("todo:todo.taskPlaceholder")}
                  label={t("todo:todo.editScreen.taskLabel")}
                />

                <div className="mt-4">
                  <SubNotesInput
                    notes={item.notes || ""}
                    setNotes={(value) => updateTask(index, { notes: value })}
                    placeholder={t("todo:todo.notesPlaceholder")}
                    label={t("todo:todo.editScreen.notesLabel")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <button onClick={handleAddTask} className="btn-add w-full">
          {t("todo:todo.editScreen.addTask")}
        </button>
        <div className="flex gap-5">
          <DeleteSessionBtn onDelete={handleDeleteAll} />
          <SaveButton onClick={handleSaveTodo} />
        </div>
      </div>

      {isSaving && (
        <FullScreenLoader message={t("todo:todo.savingTodoList")} />
      )}
    </div>
  );
}
