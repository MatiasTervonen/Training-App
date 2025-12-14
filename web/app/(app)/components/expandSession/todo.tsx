"use client";

import { formatDate } from "@/app/(app)/lib/formatDate";
import { full_todo_session } from "../../types/models";
import { SquareArrowOutUpRight, Check, Dot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import SaveButton from "../buttons/save-button";
import Modal from "../modal";
import FullScreenLoader from "../FullScreenLoader";
import { checkedTodo } from "../../database/todo";
import ExerciseTypeSelect from "../../training/components/ExerciseTypeSelect";

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
  const [sortField, setSortField] = useState<"original" | "completed">(
    "original"
  );
  const [originalOrder, setOriginalOrder] = useState(initialTodo.todo_tasks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const lastSavedRef = useRef(initialTodo.todo_tasks);

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
        // Sort incomplete tasks first (false before true)
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
          (t) => t.id === originalTask.id
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setSessionData((prev) => {
      const updatedTasks = [...prev.todo_tasks];
      const draggedTask = updatedTasks[draggedIndex];
      updatedTasks.splice(draggedIndex, 1);
      updatedTasks.splice(index, 0, draggedTask);
      return { ...prev, todo_tasks: updatedTasks };
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const updated = new Date().toISOString();

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      await checkedTodo({
        updated_at: updated,
        listId: sessionData.id,
        todo_tasks: sessionData.todo_tasks.map((task, index) => ({
          id: task.id,
          list_id: task.list_id,
          task: task.task,
          is_completed: task.is_completed,
          position: index,
        })),
      });

      // Update the baseline to match what was just saved
      lastSavedRef.current = sessionData.todo_tasks;
      setOriginalOrder(sessionData.todo_tasks);

      await mutateFullTodoSession();
      toast.success("Changes saved successfully");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData.todo_tasks) !==
    JSON.stringify(lastSavedRef.current);

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 ml-5">
          <p className="text-sm text-yellow-500">
            {hasChanges ? "unsaved changes" : ""}
          </p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}
      <div className="text-center flex flex-col min-h-full justify-between page-padding max-w-lg mx-auto">
        <div className="flex flex-col items-center w-full">
          <div className="flex w-full justify-between items-center mb-5">
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <p> Created: {formatDate(sessionData.created_at)}</p>
              {sessionData.updated_at && (
                <p className="text-yellow-500">
                  {" "}
                  Updated: {formatDate(sessionData.updated_at)}
                </p>
              )}
            </div>
            <div className="text-sm">
              <ExerciseTypeSelect
                label="sort by"
                value={sortField}
                onChange={handleSortChange}
                options={[
                  { value: "original", label: "Original" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </div>
          </div>
          <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
            <div className="my-5 text-xl wrap-break-word">
              {sessionData.title}
            </div>

            <ul className="flex flex-col gap-5">
              {sessionData.todo_tasks.map((task, index) => {
                return (
                  <div
                    key={task.id}
                    className="flex gap-4 items-center relative"
                  >
                    <input
                      onChange={() => {
                        toggleCompleted(index);
                      }}
                      checked={task.is_completed}
                      type="checkbox"
                      className=" h-6 w-6 rounded-md border border-gray-400 cursor-pointer transition-colors"
                    />
                    <li
                      className="w-full items-center border p-2 rounded-md flex justify-between gap-2 bg-slate-900 min-w-0 cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <p className="text-left line-clamp-1">{task.task}</p>
                    </li>
                    <button
                      onClick={() => setOpen(index)}
                      className="bg-blue-500 p-1 rounded-md hover:bg-blue-400 absolute right-2"
                    >
                      <SquareArrowOutUpRight size={20} />
                    </button>

                    {open === index && (
                      <Modal
                        onClose={() => {
                          setOpen(null);
                        }}
                        isOpen={true}
                      >
                        <div className="flex flex-col max-w-lg mx-auto mt-10 px-4">
                          <h3 className="text-xl mb-10 wrap-break-word">
                            {task.task}
                          </h3>
                          <p className="bg-slate-900 p-5 sm:p-10 whitespace-pre-wrap wrap-break-word rounded-md text-left">
                            {task.notes || "No notes available"}
                          </p>
                        </div>
                      </Modal>
                    )}
                    {task.is_completed && (
                      <Check
                        size={50}
                        color="green"
                        className="absolute left-1/2 -translate-x-1/2 bg-gray-400/30 w-[110%] pointer-events-none rounded-md"
                      />
                    )}
                  </div>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="mt-10  w-full">
          <SaveButton
            onClick={saveChanges}
            disabled={!hasChanges}
            label={!hasChanges ? "No changes" : "Save changes"}
          />
        </div>
        {isSaving && <FullScreenLoader message="Saving changes..." />}
      </div>
    </>
  );
}
