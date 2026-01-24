import NotesCard from "@/Features/notes/cards/notes-feed";
import WeightCard from "@/Features/feed-cards/WeightCard";
import GymCard from "@/Features/feed-cards/GymCard";
import LocalReminderCard from "@/Features/reminders/cards/LocalReminderCard-feed";
import TodoCard from "@/Features/feed-cards/TodoCard";
import GlobalReminderCard from "@/Features/reminders/cards/GlobalReminderCard-feed";
import ActivityCard from "@/Features/activities/cards/activity-feed";
import { FeedCardProps } from "@/types/session";

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
