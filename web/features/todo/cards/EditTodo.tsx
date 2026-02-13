"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editTodo } from "@/database/todo/edit-todo";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import BaseButton from "@/components/buttons/BaseButton";
import { Dot } from "lucide-react";
import { FeedItemUI } from "@/types/session";
import { full_todo_session_optional_id } from "@/types/session";
import { generateUUID } from "@/lib/generateUUID";
import { ModalSwipeBlocker } from "@/components/modal";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type Task = {
  task: string;
  notes?: string;
  position: number;
  updated_at: string;
};

export default function EditTodo({ todo_session, onClose, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("todo");
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
          tempId: generateUUID(),
          task: "",
          notes: "",
          created_at: new Date().toISOString(),
          is_completed: false,
          list_id: prev.id,
          updated_at: "",
          position: 0,
          user_id: prev.user_id,
        },
      ],
    }));
  };

  const handleDeleteItem = (index: number) => {
    setSessionData((prev) => {
      const updatedTasks = prev.todo_tasks[index];

      if (updatedTasks?.id)
        setDeletedIds((ids) => [...ids, updatedTasks.id as string]);

      const todo_tasks = prev.todo_tasks.filter((_, i) => i !== index);
      return { ...prev, todo_tasks };
    });
  };

  const handleSave = async () => {
    const updated = new Date().toISOString();

    const hasEmptyTasks = sessionData.todo_tasks.some(
      (task) => task.task.trim().length === 0,
    );

    if (hasEmptyTasks) {
      toast.error(
        <div className="flex flex-col gap-2 text-center">
          <p>{t("todo.editScreen.emptyTasksError")}</p>
          <p>{t("todo.editScreen.emptyTasksErrorSub")}</p>
        </div>,
      );
      return;
    }

    setIsSaving(true);

    try {
      const updatedFeedItem = await editTodo({
        id: sessionData.id,
        title: sessionData.title,
        tasks: sessionData.todo_tasks.map((task, index) => ({
          id: task.id,
          task: task.task,
          notes: task.notes ?? undefined,
          position: index,
          updated_at: updated,
        })),
        deletedIds,
        updated_at: updated,
      });

      toast.success(t("todo.editScreen.updateSuccess"));
      await onSave(updatedFeedItem as FeedItemUI);
      onClose();
    } catch {
      toast.error(t("todo.editScreen.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData) !== JSON.stringify(originalData);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 ml-5">
          <p className="text-sm text-yellow-500">
            {hasChanges ? t("todo.session.unsavedChanges") : ""}
          </p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}
      <div className="flex flex-col justify-between items-center gap-5 mx-auto page-padding min-h-full relative max-w-lg">
        <div className="w-full">
          <h2 className="text-lg text-center mb-10">{t("todo.editScreen.title")}</h2>
          <div className="w-full mb-10">
            <ModalSwipeBlocker className="w-full">
              <TitleInput
                value={sessionData.title}
                setValue={handleTitleChange}
                placeholder={t("todo.editScreen.titlePlaceholder")}
                label={t("todo.editScreen.titleLabel")}
              />
            </ModalSwipeBlocker>
          </div>
          <ul className="w-full">
            {sessionData.todo_tasks.map((task, index) => (
              <li
                key={task.id ?? task.tempId}
                className="text-gray-300 mb-5 bg-slate-900 p-4 rounded-lg"
              >
                <div className="flex justify-between">
                  <p className="mb-2">{index + 1}.</p>
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="text-red-500 hover:scale-105 cursor-pointer"
                  >
                    {t("todo.editScreen.delete")}
                  </button>
                </div>
                <ModalSwipeBlocker className="w-full">
                  <TitleInput
                    value={task.task}
                    setValue={(value) => updateTask(index, { task: value })}
                    placeholder={t("todo.editScreen.taskPlaceholder")}
                    label={t("todo.editScreen.taskLabel")}
                  />
                </ModalSwipeBlocker>
                <div className="mt-5">
                  <ModalSwipeBlocker className="w-full">
                    <SubNotesInput
                      notes={task.notes || ""}
                      setNotes={(value) => updateTask(index, { notes: value })}
                      placeholder={t("todo.editScreen.notesPlaceholder")}
                      label={t("todo.editScreen.notesLabel")}
                    />
                  </ModalSwipeBlocker>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full pt-10 flex flex-col gap-5">
          <BaseButton onClick={addNewTask} label={t("todo.editScreen.addTask")} />
          <SaveButton onClick={handleSave} />
        </div>
      </div>

      {isSaving && <FullScreenLoader message={t("todo.editScreen.savingTodoList")} />}
    </>
  );
}
