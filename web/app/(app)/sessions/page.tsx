import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
  ListTodo,
  Bell,
} from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";

export default function Sessions() {
  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">Start Session</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/gym">
          Gym
          <Dumbbell />
        </LinkButton>

        <LinkButton href="/notes">
          Notes
          <NotebookPen />
        </LinkButton>
        <LinkButton href="/disc-golf">
          Disc Golf
          <Disc />
        </LinkButton>

        <LinkButton href="/timer">
          Timer
          <Timer />
        </LinkButton>
        <LinkButton href="/weight">
          Weight Tracker
          <Weight />
        </LinkButton>
        <LinkButton href="/todo">
          Todo List
          <ListTodo />
        </LinkButton>
        <LinkButton href="/reminders">
          Reminders
          <Bell />
        </LinkButton>
      </div>
    </div>
  );
}
