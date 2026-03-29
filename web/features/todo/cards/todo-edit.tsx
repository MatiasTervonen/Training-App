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
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  useSortable,
  isSortable,
  isSortableOperation,
} from "@dnd-kit/react/sortable";

type Props = {
  todo_session: full_todo_session_optional_id;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function EditTodo({
  todo_session,
  onSave,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation("todo");
  const [sessionData, setSessionData] = useState(todo_session);
  const sessionDataRef = useRef(sessionData);
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);
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

  const handleAutoSave = useCallback(async () => {
    const current = sessionDataRef.current;

    const hasEmptyTasks = current.todo_tasks.some(
      (task) => task.task.trim().length === 0,
    );

    if (hasEmptyTasks) {
      throw new Error("Empty tasks");
    }

    const updated = new Date().toISOString();

    const result = await editTodo({
      id: current.id,
      title: current.title,
      tasks: current.todo_tasks.map((task, index) => ({
        id: task.id,
        temp_id: task.tempId,
        task: task.task,
        notes: task.notes ?? undefined,
        position: index,
        updated_at: updated,
      })),
      deletedIds: deletedIdsRef.current,
      updated_at: updated,
    });

    // Assign real DB IDs to new tasks so the next auto-save
    // uses the UPDATE path instead of INSERT (prevents duplicates).
    if (result.new_task_ids && Object.keys(result.new_task_ids).length > 0) {
      const assignSavedIds = (
        tasks: typeof sessionDataRef.current.todo_tasks,
      ) =>
        tasks.map((task) =>
          task.id || !task.tempId || !result.new_task_ids[task.tempId]
            ? task
            : { ...task, id: result.new_task_ids[task.tempId] },
        );

      sessionDataRef.current = {
        ...sessionDataRef.current,
        todo_tasks: assignSavedIds(sessionDataRef.current.todo_tasks),
      };

      setSessionData((prev) => ({
        ...prev,
        todo_tasks: assignSavedIds(prev.todo_tasks),
      }));
    }

    onSave(result.feed_item as FeedItemUI);
  }, [onSave]);

  const { status, hasPendingChanges } = useAutoSave({
    data: { sessionData, deletedIds },
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  const handleDragEnd = useCallback(
    (event: {
      canceled: boolean;
      operation: Parameters<typeof isSortableOperation>[0];
    }) => {
      if (event.canceled) return;
      if (!isSortableOperation(event.operation)) return;

      const { source } = event.operation;
      if (!source) return;
      const fromIndex = source.initialIndex;
      const toIndex = source.index;
      if (fromIndex === toIndex) return;

      setSessionData((prev) => {
        const updatedTasks = [...prev.todo_tasks];
        const [moved] = updatedTasks.splice(fromIndex, 1);
        updatedTasks.splice(toIndex, 0, moved);
        return { ...prev, todo_tasks: updatedTasks };
      });

      // Adjust expandedIndex after reorder
      setExpandedIndex((prev) => {
        if (prev === null) return null;
        if (prev === fromIndex) return toIndex;
        if (fromIndex < toIndex && prev > fromIndex && prev <= toIndex)
          return prev - 1;
        if (fromIndex > toIndex && prev >= toIndex && prev < fromIndex)
          return prev + 1;
        return prev;
      });
    },
    [],
  );

  return (
    <>
      <AutoSaveIndicator status={status} />
      <div className="flex flex-col justify-between mx-auto page-padding min-h-full max-w-lg">
        <div className="w-full">
          <h2 className="text-lg text-center mb-10">
            {t("todo.editScreen.title")}
          </h2>
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
          <ModalSwipeBlocker>
            <DragDropProvider onDragEnd={handleDragEnd}>
              <div className="flex flex-col gap-3">
                {sessionData.todo_tasks.map((task, index) => (
                  <SortableEditTask
                    key={task.id ?? task.tempId}
                    task={task}
                    index={index}
                    isExpanded={expandedIndex === index}
                    onExpand={() => setExpandedIndex(index)}
                    onCollapse={() => setExpandedIndex(null)}
                    onDelete={() => handleDeleteItem(index)}
                    onUpdateTask={(updates) => updateTask(index, updates)}
                    t={t}
                  />
                ))}
              </div>
              <DragOverlay>
                {(source) => {
                  if (!isSortable(source)) return null;
                  const task = sessionData.todo_tasks.find(
                    (t) => (t.id ?? t.tempId) === source.id,
                  );
                  if (!task) return null;
                  return (
                    <div className="bg-white/5 border border-blue-500 p-4 rounded-lg flex items-center shadow-lg shadow-blue-500/20 scale-[1.02]">
                      <span className="flex-1 line-clamp-1 font-body">
                        {task.task || t("todo.editScreen.taskPlaceholder")}
                      </span>
                    </div>
                  );
                }}
              </DragOverlay>
            </DragDropProvider>
          </ModalSwipeBlocker>
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

type TodoTask = full_todo_session_optional_id["todo_tasks"][number];

function SortableEditTask({
  task,
  index,
  isExpanded,
  onExpand,
  onCollapse,
  onDelete,
  onUpdateTask,
  t,
}: {
  task: TodoTask;
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onDelete: () => void;
  onUpdateTask: (updates: Record<string, string>) => void;
  t: (key: string) => string;
}) {
  const { ref, isDragSource } = useSortable({
    id: task.id ?? task.tempId ?? `task-${index}`,
    index,
  });

  if (!isExpanded) {
    return (
      <div
        ref={ref}
        className={`transition-opacity duration-200 ${isDragSource ? "opacity-40" : ""}`}
      >
        <button
          onClick={onExpand}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-lg flex items-center cursor-grab active:cursor-grabbing hover:bg-white/8 transition-colors text-left"
        >
          <span className="mr-2">{index + 1}.</span>
          <span
            className={`flex-1 line-clamp-1 font-body ${task.task ? "text-gray-100" : "text-gray-500"}`}
          >
            {task.task || t("todo.editScreen.taskPlaceholder")}
          </span>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`bg-white/5 border border-white/10 p-4 rounded-lg transition-opacity duration-200 ${isDragSource ? "opacity-40" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <span>{index + 1}.</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="text-red-500 cursor-pointer hover:text-red-400"
          >
            {t("todo.editScreen.delete")}
          </button>
          <button onClick={onCollapse} className="cursor-pointer">
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <ModalSwipeBlocker className="w-full">
        <TitleInput
          value={task.task}
          setValue={(value) => onUpdateTask({ task: value })}
          placeholder={t("todo.editScreen.taskPlaceholder")}
          label={t("todo.editScreen.taskLabel")}
        />
      </ModalSwipeBlocker>

      <div className="mt-4">
        <ModalSwipeBlocker className="w-full">
          <SubNotesInput
            notes={task.notes || ""}
            setNotes={(value) => onUpdateTask({ notes: value })}
            placeholder={t("todo.editScreen.notesPlaceholder")}
            label={t("todo.editScreen.notesLabel")}
          />
        </ModalSwipeBlocker>
      </div>
    </div>
  );
}
