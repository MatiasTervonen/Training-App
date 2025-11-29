"use client";

import { formatDate } from "@/app/(app)/lib/formatDate";
import { full_todo_session } from "../../types/models";
import { SquareArrowOutUpRight, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import SaveButton from "../../ui/save-button";
import Modal from "../modal";
import FullScreenLoader from "../FullScreenLoader";
import { checkedTodo } from "../../database/todo";

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

  const updated = new Date().toISOString();

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      await checkedTodo({
        updated_at: updated,
        listId: sessionData.id,
        todo_tasks: sessionData.todo_tasks.map((task) => ({
          id: task.id,
          list_id: task.list_id,
          task: task.task,
          is_completed: task.is_completed,
        })),
      });

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
    JSON.stringify(initialTodo.todo_tasks);

  return (
    <div className="text-center max-w-lg mx-auto flex flex-col min-h-full justify-between pb-10 pt-5 px-2">
      <div className="flex flex-col items-center">
        <div className="flex flex-col gap-2 text-sm text-gray-400 mb-10">
          <p> Created: {formatDate(sessionData.created_at)}</p>
          {sessionData.updated_at && (
            <p> Updated: {formatDate(sessionData.updated_at)}</p>
          )}
        </div>
        <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
          <div>
            <div className="my-5 text-xl wrap-break-word">
              {sessionData.title}
            </div>
          </div>
          <ul className="flex flex-col gap-5">
            {sessionData.todo_tasks.map((task, index) => {
              return (
                <div key={task.id} className="flex gap-4 items-center relative">
                  <input
                    onChange={() => {
                      toggleCompleted(index);
                    }}
                    checked={task.is_completed}
                    type="checkbox"
                    className=" h-6 w-6 rounded-md border border-gray-400 cursor-pointer transition-colors"
                  />
                  <li className="w-full items-center border p-2 rounded-md flex justify-between gap-2 bg-slate-900 min-w-0">
                    <p className="text-left line-clamp-1">{task.task}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setOpen(index)}
                        className="bg-blue-500 p-1 rounded-md hover:bg-blue-400"
                      >
                        <SquareArrowOutUpRight size={20} />
                      </button>
                    </div>

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
                  </li>
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
      <div className="mt-10 px-4">
        <SaveButton
          onClick={saveChanges}
          disabled={!hasChanges}
          label={!hasChanges ? "No changes" : "Save changes"}
        />
      </div>
      {isSaving && <FullScreenLoader message="Saving changes..." />}
    </div>
  );
}
