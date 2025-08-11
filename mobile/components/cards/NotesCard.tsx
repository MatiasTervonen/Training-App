import {
  NotebookPen,
  Ellipsis,
  SquareArrowOutUpRight,
} from "lucide-react-native";
import { notes } from "@/types/models";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import DropdownMenu from "../DropdownMenu";
import { formatDate } from "@/lib/formatDate";

type Props = {
  item: notes;
  pinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
};

export default function NotesCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: Props) {
  return (
    <View
      className={`
       border rounded-md flex-col justify-center mb-5 transition-colors ${
         pinned ? `border-yellow-200 bg-yellow-200` : "bg-slate-700 border-gray-100"
       }`}
    >
      <View className="flex-row justify-between mt-2 mb-4 mx-4">
        <AppText
          className={`line-clamp-1 border-b ${
            pinned
              ? "text-slate-900 border-slate-900"
              : "text-gray-100 border-gray-100"
          }`}
        >
          {item.title}
        </AppText>
        <DropdownMenu
          button={
            <View
              aria-label="More options"
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              <Ellipsis size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            </View>
          }
        >
          <TouchableOpacity
            aria-label="Edit note"
            onPress={() => {
              onEdit();
            }}
            className="border-b border-gray-600 py-2 px-4"
          >
            <AppText className="text-center">Edit</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            aria-label="Pin or unpin note"
            onPress={() => {
              onTogglePin();
            }}
            className="border-b border-gray-600 py-2 px-4"
          >
            <AppText className="text-center">{pinned ? "Unpin" : "Pin"}</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            aria-label="Delete note"
            onPress={() => {
              onDelete();
            }}
            className="py-2 px-4"
          >
            <AppText className="text-center">Delete</AppText>
          </TouchableOpacity>
        </DropdownMenu>
      </View>

      <AppText
        className={`ml-4 mb-4 mr-5 line-clamp-2  ${
          pinned ? "text-slate-900" : "text-gray-100"
        }`}
      >
        {item.notes}
      </AppText>

      <View className="flex-row justify-between items-center mt-2 bg-black/40 rounded-b-md">
        <View className="flex-row items-center gap-4">
          <View className="pl-2">
            <NotebookPen size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
          </View>
          <AppText className={`${pinned ? "text-slate-900" : "text-gray-100"}`}>
            Notes
          </AppText>

          <View>
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDate(item.created_at)}
            </AppText>
          </View>
        </View>
        <TouchableOpacity className="bg-blue-500 p-2 rounded-br-md">
          <SquareArrowOutUpRight
            size={20}
            color="#f3f4f6"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
