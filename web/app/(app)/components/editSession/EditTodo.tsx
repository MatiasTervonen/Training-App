"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { full_todo_session } from "../../types/models";
import { generateUUID } from "../../lib/generateUUID";
import { editTodo } from "../../database/todo";
import SubNotesInput from "../../ui/SubNotesInput";
import TitleInput from "../../ui/TitleInput";
import BaseButton from "../buttons/BaseButton";
import { Dot } from "lucide-react";

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
          id: generateUUID(),
          task: "",
          notes: "",
          created_at: new Date().toISOString(),
          is_completed: false,
          list_id: prev.id,
          user_id: prev.user_id,
          updated_at: "",
          position: 0,
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
    const updated = new Date().toISOString();

    setIsSaving(true);

    try {
      await editTodo({
        id: sessionData.id,
        title: sessionData.title,
        tasks: sessionData.todo_tasks.map((task) => ({
          id: task.id,
          task: task.task,
          notes: task.notes ?? undefined,
        })),
        deletedIds,
        updated_at: updated,
      });

      toast.success("Session updated successfully");
      await onSave?.();
      onClose();
    } catch {
      toast.error("Failed to update session");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(sessionData) !== JSON.stringify(originalData);

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
      <div className="flex flex-col justify-between items-center gap-5 mx-auto page-padding min-h-full relative max-w-lg">
        <div className="w-full">
          <h2 className="text-lg text-center mb-10">Edit your todo lists</h2>
          <div className="w-full mb-10">
            <TitleInput
              value={sessionData.title}
              setValue={handleTitleChange}
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
                  value={task.task}
                  setValue={(value) => updateTask(index, { task: value })}
                  placeholder="Todo title..."
                  label="Task..."
                />
                <div className="mt-5">
                  <SubNotesInput
                    notes={task.notes || ""}
                    setNotes={(value) => updateTask(index, { notes: value })}
                    placeholder="Todo notes..."
                    label="Notes..."
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full pt-10 flex flex-col gap-5">
          <BaseButton onClick={addNewTask} label="Add Task" />
          <SaveButton onClick={handleSave} />
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving todo list..." />}
    </>
  );
}
