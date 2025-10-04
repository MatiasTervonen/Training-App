"use client";

import {
  ListTodo,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
} from "lucide-react";
import TitleInput from "../training/components/TitleInput";
import { useState, useEffect } from "react";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import NotesInput from "../training/components/NotesInput";
import Modal from "../components/modal";
import SaveButton from "../ui/save-button";
import FullScreenLoader from "../components/FullScreenLoader";
import toast from "react-hot-toast";
import { updateFeed } from "@/app/(app)/lib/revalidateFeed";
import { useRouter } from "next/navigation";

type TodoItem = {
  task: string;
  notes?: string;
};

export default function Todo() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("todo_draft") || "null")
      : null;

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(draft?.title || "");
  const [task, setTask] = useState(draft?.task || "");
  const [notes, setNotes] = useState(draft?.notes || "");
  const [todoList, setTodoList] = useState<TodoItem[]>(draft?.todoList || []);
  const [open, setOpen] = useState<number | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [modalDraft, setModalDraft] = useState<{ task: string; notes: string }>(
    {
      task: "",
      notes: "",
    }
  );
  const router = useRouter();

  useEffect(() => {
    if (title.trim() === "" && todoList.length === 0) {
      localStorage.removeItem("todo_draft");
      return;
    } else {
      const draft = {
        title,
        todoList: todoList,
      };
      localStorage.setItem("todo_draft", JSON.stringify(draft));
    }
  }, [title, notes, todoList]);

  const handleDeleteItem = (index: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmDelete) return;

    const newList = todoList.filter((_, i) => i !== index);
    setTodoList(newList);
  };

  const handleDeleteAll = () => {
    localStorage.removeItem("todo_draft");
    setTodoList([]);
    setTask("");
    setNotes("");
    setTitle("");
  };

  const handleSaveTodo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/todo-list/save-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          todoList,
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error("Failed to save todo");
      }

      await response.json();

      updateFeed();

      toast.success("Todo saved successfully");
      router.push("/dashboard");
      handleDeleteAll();
    } catch (error) {
      console.error("Error saving todo:", error);
      toast.error("Failed to save todo");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-lg mx-auto px-4 ">
      <div>
        <div className="flex items-center gap-5 justify-center my-5">
          <h1 className="text-2xl text-gray-100">Todo List </h1>
          <ListTodo color="#f3f4f6" size={30} />
        </div>
        <TitleInput
          placeholder="Title"
          label="Add title to your todo list"
          title={title}
          setTitle={setTitle}
          maxLength={50}
        />
        <div className="mt-5">
          <TitleInput
            placeholder="Enter task..."
            label="Add task to your todo list"
            title={task}
            setTitle={setTask}
            maxLength={150}
          />
        </div>
        <div className="mt-5">
          <NotesInput
            placeholder="Enter notes...(optional)"
            label="Add notes to your task"
            notes={notes}
            setNotes={setNotes}
            maxLength={1000}
          />
        </div>
        <button
          onClick={() => {
            if (task.trim() === "") return;
            setTodoList([...todoList, { task, notes }]);
            setNotes("");
            setTask("");
          }}
          className=" my-5 flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
        >
          Add
        </button>
        <div className="flex flex-col items-center my-10">
          <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
            <h2 className="text-gray-100 my-10 text-2xl text-center break-words line-clamp-2">
              {title || "My Todo List"}
            </h2>
            <ul className="flex flex-col gap-5">
              {todoList.map((item: TodoItem, index: number) => (
                <li
                  className="text-gray-100 text-lg border p-2 rounded-md flex justify-between gap-2 bg-slate-900"
                  key={index}
                >
                  <p className="overflow-hidden break-words line-clamp-2">
                    {item.task}
                  </p>
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
                        setEdit(null);
                      }}
                      isOpen={true}
                    >
                      <div className="flex flex-col justify-center items-center max-w-lg mx-auto px-5">
                        {edit === index ? (
                          <>
                            <h3 className="my-5 text-2xl">Edit Task</h3>
                            <div className="my-10 w-full">
                              <TitleInput
                                placeholder="Edit task..."
                                label="Edit your task"
                                title={modalDraft.task}
                                setTitle={(newTask) => {
                                  setModalDraft({
                                    ...modalDraft,
                                    task: newTask,
                                  });
                                }}
                              />
                            </div>
                            <div className="w-full">
                              <NotesInput
                                placeholder="Enter notes...(optional)"
                                label="Add your notes"
                                notes={modalDraft.notes}
                                setNotes={(newNotes) => {
                                  setModalDraft({
                                    ...modalDraft,
                                    notes: newNotes,
                                  });
                                }}
                              />
                            </div>
                            <div className="w-full flex gap-5 mt-20">
                              <button
                                onClick={() => {
                                  setTodoList((list: TodoItem[]) =>
                                    list.map((item, i) =>
                                      i === index
                                        ? { ...item, ...modalDraft }
                                        : item
                                    )
                                  );
                                  setEdit(null);
                                }}
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
                              >
                                <p>save</p>
                              </button>
                              <button
                                onClick={() => {
                                  setEdit(null);
                                  setModalDraft({ task: "", notes: "" });
                                }}
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
                              >
                                <p>cancel</p>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div>
                            <h3 className="text-gray-100 text-2xl my-10 w-full break-words overflow-hidden text-center">
                              {item.task}
                            </h3>
                            <p className="text-gray-400 w-full break-words overflow-hidden text-center">
                              {item.notes || "No notes available"}
                            </p>
                            <div className="flex w-full gap-5 mt-20">
                              <button
                                onClick={() => {
                                  setEdit(index);
                                  setModalDraft({
                                    task: item.task,
                                    notes: item.notes ?? "",
                                  });
                                }}
                                className="w-full flex items-center justify-center px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
                              >
                                <p>edit</p>
                                <SquarePen size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteItem(index);
                                  setOpen(null);
                                }}
                                className="w-full flex items-center justify-center px-4 gap-2  bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-105"
                              >
                                <p>delete</p>
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Modal>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 pb-10">
        <SaveButton disabled={!draft} onClick={handleSaveTodo} />
        <DeleteSessionBtn disabled={!draft} onDelete={handleDeleteAll} />
      </div>
      {loading && <FullScreenLoader message="Saving..." />}
    </div>
  );
}
