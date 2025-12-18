import NotesCard from "@/app/(app)/components/cards/NotesCard";
import GymCard from "@/app/(app)/components/cards/GymCard";
import WeightCard from "@/app/(app)/components/cards/WeightCard";
import TodoCard from "@/app/(app)/components/cards/TodoCard";
import { FeedItem } from "@/app/(app)/types/models";
import LocalReminderCard from "@/app/(app)/components/cards/localReminderCard";
import GlobalReminderCard from "@/app/(app)/components/cards/globalReminderCard";

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
    case "global_reminders":
      return (
        <GlobalReminderCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onExpand={onExpand}
          onEdit={onEdit}
        />
      );
    case "local_reminders":
      return (
        <LocalReminderCard
          item={props.item}
          pinned={pinned}
          onTogglePin={onTogglePin}
          onExpand={onExpand}
        />
      );
  }
}
