import NotesCard from "@/features/notes/cards/notes-feed";
import WeightCard from "@/features/weight/cards/weight-feed";
import GymCard from "@/features/gym/cards/gym-feed";
import LocalReminderCard from "@/features/reminders/cards/LocalReminderCard-feed";
import TodoCard from "@/features/todo/cards/todo-feed";
import GlobalReminderCard from "@/features/reminders/cards/GlobalReminderCard-feed";
import ActivityCard from "@/features/activities/cards/activity-feed";
import HabitSummaryCard from "@/features/habits/cards/habit-feed";
import ReportCard from "@/features/reports/cards/report-feed";
import NutritionCard from "@/features/nutrition/cards/nutrition-feed";
import TutorialCard from "@/features/feed-cards/tutorial-feed";
import { FeedCardProps } from "@/types/session";

export default function FeedCard(props: FeedCardProps) {
  const { pinned, onTogglePin, onDelete, onExpand, onEdit, onMoveToFolder, onHide } = props;

  const commomProps = {
    item: props.item,
    pinned: pinned,
    onTogglePin: onTogglePin,
    onDelete: onDelete,
    onExpand: onExpand,
    onEdit: onEdit,
    onHide: onHide,
  };

  switch (props.item.type) {
    case "notes":
      return <NotesCard {...commomProps} onMoveToFolder={onMoveToFolder} />;
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
    case "habits":
      return <HabitSummaryCard {...commomProps} />;
    case "reports":
      return <ReportCard {...commomProps} />;
    case "nutrition":
      return <NutritionCard {...commomProps} />;
    case "tutorial":
      return <TutorialCard {...commomProps} />;
  }
}
