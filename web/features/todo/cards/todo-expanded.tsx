"use client";

import { formatDate } from "@/lib/formatDate";
import { full_todo_session } from "@/types/models";
import { SquareArrowOutUpRight, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Modal, { ModalSwipeBlocker } from "@/components/modal";
import { checkedTodo } from "@/database/todo/check-todo";
import ExerciseTypeSelect from "@/features/gym/components/ExerciseTypeSelect";
import { FeedItemUI } from "@/types/session";
import { useTranslation } from "react-i18next";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { useQuery } from "@tanstack/react-query";
import { getTodoMedia } from "@/database/media/get-todo-media";
import SessionMediaGallery from "@/components/media/SessionMediaGallery";
import { TodoTaskMedia } from "@/types/media";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useSortable, isSortable, isSortableOperation } from "@dnd-kit/react/sortable";

type TodoSessionProps = {
  initialTodo: full_todo_session;
  onSave: (updatedItem: FeedItemUI) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function TodoSession({
  initialTodo,
  onSave,
  onDirtyChange,
}: TodoSessionProps) {
  const { t } = useTranslation("todo");
  const [open, setOpen] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState(initialTodo);

  const taskIds = useMemo(
    () => initialTodo.todo_tasks.map((task) => task.id),
    [initialTodo.todo_tasks],
  );

  const { data: todoMedia } = useQuery({
    queryKey: ["todo-media", initialTodo.id],
    queryFn: () => getTodoMedia(taskIds),
    enabled: taskIds.length > 0,
  });
  const [sortField, setSortField] = useState<"original" | "completed">(
    "original",
  );
  const [originalOrder, setOriginalOrder] = useState(initialTodo.todo_tasks);
  const lastSavedRef = useRef(initialTodo.todo_tasks);

  const sessionDataRef = useRef(sessionData);
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Sync with initialTodo when it changes (after refetch)
  useEffect(() => {
    // Only update if there are no unsaved changes to avoid overwriting user edits
    const currentHasChanges =
      JSON.stringify(sessionData.todo_tasks) !==
      JSON.stringify(lastSavedRef.current);

    if (!currentHasChanges) {
      setSessionData(initialTodo);
      setOriginalOrder(initialTodo.todo_tasks);
      lastSavedRef.current = initialTodo.todo_tasks;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTodo]);

  // Only track task completion and order — ignore updated_at and other fields
  // to prevent infinite save loops when the parent updates initialTodo after save
  const autoSaveData = useMemo(
    () =>
      sessionData.todo_tasks.map((t) => ({
        id: t.id,
        is_completed: t.is_completed,
      })),
    [sessionData.todo_tasks],
  );

  const handleAutoSave = useCallback(async () => {
    const current = sessionDataRef.current;

    const updatedFeedItem = await checkedTodo({
      updated_at: new Date().toISOString(),
      list_id: current.id,
      todo_tasks: current.todo_tasks.map((task, index) => ({
        id: task.id,
        list_id: task.list_id,
        task: task.task,
        is_completed: task.is_completed,
        position: index,
      })),
    });

    // Update the baseline to match what was just saved
    lastSavedRef.current = current.todo_tasks;
    setOriginalOrder(current.todo_tasks);

    await onSaveRef.current(updatedFeedItem as FeedItemUI);
  }, []);

  const { status, hasPendingChanges } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

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

  const sortTodoByCompleted = () => {
    setSessionData((prev) => {
      const sortedTasks = [...prev.todo_tasks].sort((a, b) => {
        if (a.is_completed === b.is_completed) return 0;
        return a.is_completed ? 1 : -1;
      });
      return { ...prev, todo_tasks: sortedTasks };
    });
  };

  const resetToOriginalOrder = () => {
    setSessionData((prev) => {
      const restoredTasks = originalOrder.map((originalTask) => {
        const currentTask = prev.todo_tasks.find(
          (t) => t.id === originalTask.id,
        );
        return currentTask || originalTask;
      });
      return { ...prev, todo_tasks: restoredTasks };
    });
  };

  const handleSortChange = (value: string) => {
    setSortField(value as "original" | "completed");
    if (value === "completed") {
      sortTodoByCompleted();
    } else {
      resetToOriginalOrder();
    }
  };

  const handleDragEnd = useCallback(
    (event: { canceled: boolean; operation: Parameters<typeof isSortableOperation>[0] }) => {
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
    },
    [],
  );

  return (
    <>
      <AutoSaveIndicator status={status} />
      <div className="text-center flex flex-col min-h-full justify-between page-padding max-w-lg mx-auto">
        <div className="flex flex-col items-center w-full">
          <div className="flex w-full justify-between items-center mb-5">
            <div className="flex flex-col gap-2 text-sm text-gray-400 font-body">
              <p>
                {t("todo.session.created")} {formatDate(sessionData.created_at)}
              </p>
              {sessionData.updated_at && (
                <p className="text-slate-400">
                  {t("todo.session.updated")}{" "}
                  {formatDate(sessionData.updated_at)}
                </p>
              )}
            </div>
            <div className="text-sm">
              <ExerciseTypeSelect
                label={t("todo.session.sortTasks")}
                value={sortField}
                onChange={handleSortChange}
                options={[
                  { value: "original", label: t("todo.session.originalOrder") },
                  {
                    value: "completed",
                    label: t("todo.session.completedStatus"),
                  },
                ]}
              />
            </div>
          </div>
          <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
            <div className="my-5 text-xl wrap-break-word">
              {sessionData.title}
            </div>

            <ModalSwipeBlocker>
            <DragDropProvider onDragEnd={handleDragEnd}>
              <ul className="flex flex-col gap-3">
                {sessionData.todo_tasks.map((task, index) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    isOpen={open === index}
                    onOpenModal={() => setOpen(index)}
                    onCloseModal={() => setOpen(null)}
                    onToggleCompleted={() => toggleCompleted(index)}
                    todoMedia={todoMedia}
                    t={t}
                  />
                ))}
              </ul>
              <DragOverlay>
                {(source) => {
                  if (!isSortable(source)) return null;
                  const task = sessionData.todo_tasks.find((t) => t.id === source.id);
                  if (!task) return null;
                  return (
                    <div className="flex gap-4 items-center">
                      <div className="h-6 w-6 shrink-0" />
                      <li className="w-full items-center border border-blue-500 p-2 rounded-md flex gap-2 bg-slate-800 min-w-0 shadow-lg shadow-blue-500/20 scale-[1.02] list-none">

                        <p className="text-left line-clamp-1 truncate mr-8 font-body">
                          {task.task}
                        </p>
                      </li>
                    </div>
                  );
                }}
              </DragOverlay>
            </DragDropProvider>
            </ModalSwipeBlocker>
          </div>
        </div>
      </div>
    </>
  );
}

function SortableTaskItem({
  task,
  index,
  isOpen,
  onOpenModal,
  onCloseModal,
  onToggleCompleted,
  todoMedia,
  t,
}: {
  task: full_todo_session["todo_tasks"][number];
  index: number;
  isOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onToggleCompleted: () => void;
  todoMedia: TodoTaskMedia | undefined;
  t: (key: string) => string;
}) {
  const { ref, isDragSource } = useSortable({
    id: task.id,
    index,
  });

  return (
    <div
      ref={ref}
      className={`flex gap-4 items-center relative transition-opacity duration-200 ${isDragSource ? "opacity-40" : ""}`}
    >
      <input
        onChange={onToggleCompleted}
        checked={task.is_completed}
        type="checkbox"
        className="h-6 w-6 shrink-0 rounded-md border border-slate-600 cursor-pointer transition-colors appearance-none bg-slate-800 checked:bg-blue-500 grid place-content-center before:content-['✓'] before:scale-0 checked:before:scale-100 before:transition-transform"
      />
      <li className="w-full items-center border border-slate-700 p-2 rounded-md flex gap-2 bg-slate-900 min-w-0 cursor-grab active:cursor-grabbing list-none">

        <p className="text-left line-clamp-1 truncate mr-8 font-body">
          {task.task}
        </p>
      </li>
      <button
        onClick={onOpenModal}
        className="p-1 absolute right-2 cursor-pointer"
      >
        <SquareArrowOutUpRight size={18} className="text-slate-500" />
      </button>

      {isOpen && (
        <Modal onClose={onCloseModal} isOpen={true}>
          <div className="text-center max-w-lg mx-auto page-padding">
            <div className="bg-white/5 border border-white/10 px-5 pt-5 pb-10 rounded-md shadow-md mt-5">
              <h3 className="text-xl text-center mb-10 border-b border-gray-700 pb-2 wrap-break-word">
                {task.task}
              </h3>
              <p className="whitespace-pre-wrap wrap-break-word overflow-hidden max-w-full text-left font-body">
                {task.notes || t("todo.noNotesAvailable")}
              </p>
              {todoMedia?.[task.id] && (
                <SessionMediaGallery
                  images={todoMedia[task.id].images}
                  videos={todoMedia[task.id].videos}
                  voiceRecordings={todoMedia[task.id].voiceRecordings}
                />
              )}
            </div>
          </div>
        </Modal>
      )}
      {task.is_completed && (
        <Check
          size={50}
          color="#15803d"
          className="absolute left-1/2 -translate-x-1/2 bg-gray-400/20 w-[110%] pointer-events-none rounded-md"
        />
      )}
    </div>
  );
}
