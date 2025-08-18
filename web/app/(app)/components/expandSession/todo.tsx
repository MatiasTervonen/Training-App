"use client";

import { formatDate } from "@/app/(app)/lib/formatDate";
import { full_todo_session } from "../../types/models";
import { SquareArrowOutUpRight, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import SaveButton from "../../ui/save-button";
import Modal from "../modal";
import FullScreenLoader from "../FullScreenLoader";

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

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/todo-list/checked-todo", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          todo_tasks: sessionData.todo_tasks.map((task) => ({
            id: task.id,
            list_id: task.list_id,
            is_completed: task.is_completed,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      await mutateFullTodoSession();
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData.todo_tasks) !==
    JSON.stringify(initialTodo.todo_tasks);

  return (
    <div className="text-center text-gray-100 max-w-lg mx-auto flex flex-col h-full justify-between px-4">
      <div className="flex flex-col items-center">
        <div className="text-sm text-gray-400 mb-10 mt-5">
          {formatDate(sessionData.created_at!)}
        </div>
        <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
          <div>
            <div className="my-5 text-xl">{sessionData.title}</div>
          </div>
          <ul className="flex flex-col gap-5">
            {sessionData.todo_tasks.map((task, index) => {
              return (
                <div
                  key={task.id}
                  className="flex gap-4 items-center relative "
                >
                  <input
                    onChange={() => {
                      toggleCompleted(index);
                    }}
                    checked={task.is_completed}
                    type="checkbox"
                    className=" h-6 w-6 rounded-md border border-gray-400 bg-slate-800 cursor-pointer transition-colors"
                  />
                  <li className="flex-grow w-full text-gray-100 text-lg border p-2 rounded-md flex justify-between gap-2 bg-slate-900">
                    <p className="line-clamp-2 text-left">{task.task}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setOpen(index)}
                        className="bg-blue-500 text-gray-100 px-1 rounded-md hover:bg-blue-400"
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
                        <div className="flex flex-col justify-center items-center max-w-lg mx-auto px-5">
                          <h3 className="text-gray-100 text-2xl my-10">
                            {task.task}
                          </h3>
                          <p className="text-gray-400">
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
      <div className="my-10">
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
