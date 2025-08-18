import NotesCard from "./cards/NotesCard";
import GymCard from "./cards/GymCard";
import WeightCard from "./cards/WeightCard";
import TodoCard from "./cards/TodoCard";
import { FeedCardProps } from "../types/session";

export default function FeedCard(props: FeedCardProps) {
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
  }
}
