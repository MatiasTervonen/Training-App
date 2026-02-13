import NotesCard from "@/features/notes/cards/NotesCard";
import GymCard from "@/features/gym/cards/GymCard";
import WeightCard from "@/features/weight/cards/WeightCard";
import TodoCard from "@/features/todo/cards/TodoCard";
import { FeedCardProps } from "@/types/session";
import LocalReminderCard from "@/features/reminders/cards/localReminderCard";
import GlobalReminderCard from "@/features/reminders/cards/globalReminderCard";
import ActivityCard from "@/features/activities/cards/activity-feed";

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
    case "activity_sessions":
      return <ActivityCard {...commomProps} />;
  }
}
