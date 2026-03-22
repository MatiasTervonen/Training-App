"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { editTodo } from "@/database/todo/edit-todo";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FeedItemUI } from "@/types/session";
import { full_todo_session_optional_id } from "@/types/session";
import { generateUUID } from "@/lib/generateUUID";
import { ModalSwipeBlocker } from "@/components/modal";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function EditTodo({ todo_session, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("todo");
  const [sessionData, setSessionData] = useState(todo_session);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const deletedIdsRef = useRef(deletedIds);
  useEffect(() => {
    deletedIdsRef.current = deletedIds;
  }, [deletedIds]);

  const handleTitleChange = (value: string) => {
    setSessionData((prev) => ({ ...prev, title: value }));
  };

  const updateTask = (index: number, updates: Record<string, string>) => {
    setSessionData((prev) => {
      const updatedTasks = [...prev.todo_tasks];
      updatedTasks[index] = { ...updatedTasks[index], ...updates };
      return { ...prev, todo_tasks: updatedTasks };
    });
  };

  const addNewTask = () => {
    const newIndex = sessionData.todo_tasks.length;
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
    setExpandedIndex(newIndex);
  };

  const handleDeleteItem = (index: number) => {
    const confirmed = window.confirm(t("todo.editScreen.confirmDelete"));
    if (!confirmed) return;

    setSessionData((prev) => {
      const deletedTask = prev.todo_tasks[index];
      if (deletedTask?.id)
        setDeletedIds((ids) => [...ids, deletedTask.id as string]);

      const todo_tasks = prev.todo_tasks.filter((_, i) => i !== index);
      return { ...prev, todo_tasks };
    });

    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  const handleAutoSave = useCallback(
    async (data: { sessionData: full_todo_session_optional_id; deletedIds: string[] }) => {
      const hasEmptyTasks = data.sessionData.todo_tasks.some(
        (task) => task.task.trim().length === 0,
      );

      if (hasEmptyTasks) {
        throw new Error("Empty tasks");
      }

      const updated = new Date().toISOString();

      const updatedFeedItem = await editTodo({
        id: data.sessionData.id,
        title: data.sessionData.title,
        tasks: data.sessionData.todo_tasks.map((task, index) => ({
          id: task.id,
          task: task.task,
          notes: task.notes ?? undefined,
          position: index,
          updated_at: updated,
        })),
        deletedIds: deletedIdsRef.current,
        updated_at: updated,
      });

      onSave(updatedFeedItem as FeedItemUI);
    },
    [onSave],
  );

  const { status, hasPendingChanges } = useAutoSave({
    data: { sessionData, deletedIds },
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  return (
    <>
      <AutoSaveIndicator status={status} />
      <div className="flex flex-col justify-between mx-auto page-padding min-h-full max-w-lg">
        <div className="w-full">
          <h2 className="text-lg text-center mb-10">{t("todo.editScreen.title")}</h2>
          <div className="w-full mb-8">
            <ModalSwipeBlocker className="w-full">
              <TitleInput
                value={sessionData.title}
                setValue={handleTitleChange}
                placeholder={t("todo.editScreen.titlePlaceholder")}
                label={t("todo.editScreen.titleLabel")}
              />
            </ModalSwipeBlocker>
          </div>

          {/* Task cards */}
          <div className="flex flex-col gap-3">
            {sessionData.todo_tasks.map((task, index) => {
              const isExpanded = expandedIndex === index;

              if (!isExpanded) {
                return (
                  <button
                    key={task.id ?? task.tempId}
                    onClick={() => setExpandedIndex(index)}
                    className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center cursor-pointer hover:bg-white/8 transition-colors text-left"
                  >
                    <span className="mr-2">{index + 1}.</span>
                    <span
                      className={`flex-1 line-clamp-1 font-body ${task.task ? "text-gray-100" : "text-gray-500"}`}
                    >
                      {task.task || t("todo.editScreen.taskPlaceholder")}
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>
                );
              }

              return (
                <div
                  key={task.id ?? task.tempId}
                  className="bg-white/5 border border-white/10 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span>{index + 1}.</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="text-red-500 cursor-pointer hover:text-red-400"
                      >
                        {t("todo.editScreen.delete")}
                      </button>
                      <button
                        onClick={() => setExpandedIndex(null)}
                        className="cursor-pointer"
                      >
                        <ChevronUp size={20} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <ModalSwipeBlocker className="w-full">
                    <TitleInput
                      value={task.task}
                      setValue={(value) => updateTask(index, { task: value })}
                      placeholder={t("todo.editScreen.taskPlaceholder")}
                      label={t("todo.editScreen.taskLabel")}
                    />
                  </ModalSwipeBlocker>

                  <div className="mt-4">
                    <ModalSwipeBlocker className="w-full">
                      <SubNotesInput
                        notes={task.notes || ""}
                        setNotes={(value) => updateTask(index, { notes: value })}
                        placeholder={t("todo.editScreen.notesPlaceholder")}
                        label={t("todo.editScreen.notesLabel")}
                      />
                    </ModalSwipeBlocker>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full mt-10">
          <button onClick={addNewTask} className="btn-add w-full">
            {t("todo.editScreen.addTask")}
          </button>
        </div>
      </div>
    </>
  );
}
