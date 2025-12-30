import NotesCard from "@/app/(app)/components/feed-cards/NotesCard";
import GymCard from "@/app/(app)/components/feed-cards/GymCard";
import WeightCard from "@/app/(app)/components/feed-cards/WeightCard";
import TodoCard from "@/app/(app)/components/feed-cards/TodoCard";
import { FeedCardProps } from "@/app/(app)/types/session";
import LocalReminderCard from "@/app/(app)/components/feed-cards/localReminderCard";
import GlobalReminderCard from "@/app/(app)/components/feed-cards/globalReminderCard";

export default function FeedCard(props: FeedCardProps) {
  const { pinned, onTogglePin, onDelete, onExpand, onEdit } = props;

  const commomProps = {
    item: props.item,
    pinned: pinned,
    onTogglePin: onTogglePin,
    onDelete: onDelete,
    onExpand: onExpand,
    onEdit: onEdit,
  };

  switch (props.item.type) {
    case "notes":
      return <NotesCard {...commomProps} />;
    case "weight":
      return <WeightCard {...commomProps} />;
    case "gym_sessions":
      return <GymCard {...commomProps} />;
    case "global_reminders":
      return <GlobalReminderCard {...commomProps} />;
    case "local_reminders":
      return <LocalReminderCard {...commomProps} />;
    case "todo_lists":
      return <TodoCard {...commomProps} />;
  }
}
