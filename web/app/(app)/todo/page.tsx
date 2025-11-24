"use client";

import {
  ListTodo,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import DeleteSessionBtn from "../ui/deleteSessionBtn";
import Modal from "../components/modal";
import SaveButton from "../ui/save-button";
import FullScreenLoader from "../components/FullScreenLoader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { saveTodoToDB } from "../database/todo";
import TitleInput from "../ui/TitleInput";
import SubNotesInput from "../ui/SubNotesInput";
import { useQueryClient } from "@tanstack/react-query";

type TodoItem = {
  task: string;
  notes: string | null;
};

export default function Todo() {
  const draft =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("todo_draft") || "null")
      : null;

  const [loading, setLoading] = useState(false);
  const [title, setValue] = useState(draft?.title || "");
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

  const queryClient = useQueryClient();

  useEffect(() => {
    if (title.trim() === "" && todoList.length === 0) {
      localStorage.removeItem("todo_draft");
      return;
    } else {
      const draft = {
        title,
        task,
        notes,
        todoList: todoList,
      };
      localStorage.setItem("todo_draft", JSON.stringify(draft));
    }
  }, [title, notes, todoList, task]);

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
    setValue("");
  };

  const handleSaveTodo = async () => {
    setLoading(true);
    try {
      await saveTodoToDB({ title, todoList });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      toast.success("Todo saved successfully");
      router.push("/dashboard");
      handleDeleteAll();
    } catch {
      toast.error("Failed to save todo");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-md mx-auto px-5 pt-5">
      <div>
        <div className="flex items-center gap-5 justify-center mb-10">
          <h1 className="text-2xl">Todo List </h1>
          <ListTodo color="#f3f4f6" size={30} />
        </div>
        <TitleInput
          placeholder="Title"
          label="Add title to your todo list"
          value={title}
          setValue={setValue}
        />
        <div className="mt-5">
          <TitleInput
            placeholder="Enter task..."
            label="Add task to your todo list"
            value={task}
            setValue={setTask}
          />
        </div>
        <div className="mt-5">
          <SubNotesInput
            placeholder="Enter notes...(optional)"
            label="Add notes to your task"
            notes={notes}
            setNotes={setNotes}
          />
        </div>
        <button
          onClick={() => {
            if (task.trim() === "") return;
            setTodoList([...todoList, { task, notes }]);
            setNotes("");
            setTask("");
          }}
          className=" my-5 flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
        >
          Add
        </button>
        <div className="flex flex-col items-center my-10">
          <div className="bg-slate-950 px-4 rounded-xl pb-5 w-full">
            <h2 className="my-10 text-2xl text-center wrap-break-word line-clamp-2">
              {title || "My Todo List"}
            </h2>
            <ul className="flex flex-col gap-5">
              {todoList.map((item: TodoItem, index: number) => (
                <li
                  className=" text-lg border p-2 rounded-md flex justify-between gap-2 bg-slate-900"
                  key={index}
                >
                  <p className="overflow-hidden wrap-break-word line-clamp-2">
                    {item.task}
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setOpen(index)}
                      className="bg-blue-500 px-1 rounded-md hover:bg-blue-400"
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
                                value={modalDraft.task}
                                setValue={(newTask) => {
                                  setModalDraft({
                                    ...modalDraft,
                                    task: newTask,
                                  });
                                }}
                              />
                            </div>
                            <div className="w-full">
                              <SubNotesInput
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
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>save</p>
                              </button>
                              <button
                                onClick={() => {
                                  setEdit(null);
                                  setModalDraft({ task: "", notes: "" });
                                }}
                                className="w-full px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>cancel</p>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div>
                            <h3 className=" text-2xl my-10 w-full wrap-break-word overflow-hidden text-center max-w-lg">
                              {item.task}
                            </h3>
                            <p className="text-gray-400 w-full wrap-break-word overflow-hidden text-center">
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
                                className="w-[130px] flex items-center justify-center px-4 gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                              >
                                <p>edit</p>
                                <SquarePen size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteItem(index);
                                  setOpen(null);
                                }}
                                className="w-[130px] flex items-center justify-center px-4 gap-2  bg-red-800 py-2 rounded-md shadow-md border-2 border-red-500 text-lg cursor-pointer hover:bg-red-700 hover:scale-105 transition-transform duration-200"
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
      <div className="flex flex-col gap-5">
        <SaveButton disabled={!draft} onClick={handleSaveTodo} />
        <DeleteSessionBtn disabled={!draft} onDelete={handleDeleteAll} />
      </div>
      {loading && <FullScreenLoader message="Saving todolist..." />}
    </div>
  );
}
