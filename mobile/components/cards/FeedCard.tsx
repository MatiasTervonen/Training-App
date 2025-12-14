import NotesCard from "./NotesCard";
import WeightCard from "./WeightCard";
import GymCard from "./GymCard";
import ReminderCard from "./ReminderCard";
import CustomReminderCard from "./CustomReminderCard";
import TodoCard from "./TodoCard";
import { FeedItem } from "@/types/models";

export default function FeedCard(props: FeedItem) {
  const { pinned, onTogglePin, onDelete, onExpand, onEdit } = props;

  switch (props.table) {
    case "notes":
      return (
        <NotesCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "weight":
      return (
        <WeightCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "gym_sessions":
      return (
        <GymCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "reminders":
      return (
        <ReminderCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "custom_reminders":
      return (
        <CustomReminderCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "todo_lists":
      return (
        <TodoCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
  }
}
