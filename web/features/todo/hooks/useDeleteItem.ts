type TodoItem = {
  task: string;
  notes: string | null;
};

export default function useDeleteItem({
  todoList,
  setTodoList,
}: {
  todoList: TodoItem[];
  setTodoList: (todoList: TodoItem[]) => void;
}) {
  const handleDeleteItem = (index: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmDelete) return;

    const newList = todoList.filter((_, i) => i !== index);
    setTodoList(newList);
  };
  return {
    handleDeleteItem,
  };
}
