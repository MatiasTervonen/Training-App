import { ListTodo, Ellipsis, SquareArrowOutUpRight } from "lucide-react-native";
import DropdownMenu from "../DropdownMenu";
import { formatDate } from "@/lib/formatDate";
import { todo_lists, full_todo_session } from "@/types/models";
import { View } from "react-native";
import AppText from "../AppText";
import AnimatedButton from "../buttons/animatedButton";
import { useQuery } from "@tanstack/react-query";
import { getFullTodoSession } from "@/api/todo/get-full-todo";

type Props = {
  item: todo_lists;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function TodoCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {

  // Use Full-todo-session from cache. Prefetched when feed loads.

  const { data: fullTodo } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", item.id],
    queryFn: () => getFullTodoSession(item.id),
    enabled: false,
  });

  const total = fullTodo?.todo_tasks.length;

  const completed = fullTodo
    ? fullTodo.todo_tasks.filter((t) => t.is_completed).length
    : 0;

  return (
    <View
      className={`
       border rounded-md flex-col justify-between mb-10 transition-colors min-h-[159px] ${
         pinned
           ? `border-yellow-200 bg-yellow-200 text-slate-900`
           : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="justify-between flex-1">
        <View className="flex-row justify-between items-center mt-2 mx-4">
          <AppText
            className={`flex-1 mr-8 underline text-lg ${
              pinned ? "text-slate-900 border-slate-900" : "text-gray-100"
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </AppText>
          <DropdownMenu
            button={
              <Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            }
            pinned={pinned}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        </View>

        {fullTodo && (
          <AppText
            className={`ml-4 ${pinned ? "text-slate-900" : "text-gray-100"}`}
          >
            completed: {completed} / {total}
          </AppText>
        )}

        <AppText
          className={`text-sm ml-4 ${
            pinned ? "text-slate-900" : "text-yellow-500"
          } `}
        >
          updated: {formatDate(item.updated_at!)}
        </AppText>
      </View>

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <ListTodo size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Todo
          </AppText>

          <View>
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDate(item.created_at)}
            </AppText>
          </View>
        </View>

        <AnimatedButton
          onPress={onExpand}
          className="bg-blue-500 p-2 rounded-br-md"
        >
          <SquareArrowOutUpRight size={20} color="#f3f4f6" />
        </AnimatedButton>
      </View>
    </View>
  );
}
