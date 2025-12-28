import NotesCard from "./NotesCard";
import WeightCard from "./WeightCard";
import GymCard from "./GymCard";
import LocalReminderCard from "./LocalReminderCard";
import TodoCard from "./TodoCard";
import GlobalReminderCard from "./GlobalReminderCard";
import ActivityCard from "./ActivityCard";
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
    case "activity_session":
      return <ActivityCard {...commomProps} />;
  }
}
