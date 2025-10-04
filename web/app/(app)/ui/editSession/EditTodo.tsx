"use client";

import { useState } from "react";
import NotesInput from "@/app/(app)/training/components/NotesInput";
import TitleInput from "@/app/(app)/training/components/TitleInput";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { full_todo_session } from "../../types/models";
import { generateUUID } from "../../lib/generateUUID";

type Props = {
  todo_session: full_todo_session;
  onClose: () => void;
  onSave?: () => void;
};

type Task = {
  task: string;
  notes: string;
};

export default function EditTodo({ todo_session, onClose, onSave }: Props) {
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
          id: generateUUID(),
          task: "",
          notes: "",
          created_at: new Date().toISOString(),
          is_completed: false,
          list_id: prev.id,
          user_id: prev.user_id,
        },
      ],
    }));
  };

  const handleDeleteItem = (index: number) => {
    setSessionData((prev) => {
      const updatedTasks = prev.todo_tasks[index];

      if (updatedTasks?.id) setDeletedIds((ids) => [...ids, updatedTasks.id]);

      const todo_tasks = prev.todo_tasks.filter((_, i) => i !== index);
      return { ...prev, todo_tasks };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const res = await fetch("/api/todo-list/edit-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: sessionData.id,
          title: sessionData.title,
          tasks: sessionData.todo_tasks.map((task) => ({
            id: task.id,
            task: task.task,
            notes: task.notes,
          })),
          deletedIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Session updated successfully");
      onSave?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update session");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full bg-slate-800 max-w-lg">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2 className="text-gray-100 text-lg text-center">
            Edit your todo lists
          </h2>
          <div className="w-full">
            <TitleInput
              title={sessionData.title || ""}
              setTitle={handleTitleChange}
              placeholder="Todo title..."
              label="Title..."
            />
          </div>
          <ul className="w-full">
            {sessionData.todo_tasks.map((task, index) => (
              <li
                key={task.id}
                className="text-gray-300 mb-5 bg-slate-900 p-4 rounded-lg"
              >
                <div className="flex justify-between">
                  <p className="mb-2">{index + 1}.</p>
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="text-red-500 hover:scale-105 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
                <TitleInput
                  title={task.task || ""}
                  setTitle={(value) => updateTask(index, { task: value })}
                  placeholder="Todo title..."
                  label="Task..."
                />
                <div className="mt-5">
                  <NotesInput
                    notes={task.notes || ""}
                    setNotes={(value) => updateTask(index, { notes: value })}
                    placeholder="Todo notes..."
                    label="Notes..."
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="w-full py-10 flex flex-col gap-5">
            <button
              onClick={addNewTask}
              className="w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
            >
              Add Task
            </button>
            <SaveButton onClick={handleSave} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving todo list..." />}
    </>
  );
}
