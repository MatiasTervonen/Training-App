import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
  ListTodo,
  Bell,
} from "lucide-react";
import SessionsContext from "./components/SessionContext";
import LinkButton from "../ui/LinkButton";

export default function Sessions() {
  return (
    <SessionsContext>
      <div className="p-5 h-full max-w-md mx-auto mb-20">
        <h1 className=" text-gray-100 text-center mt-5 mb-10 text-2xl ">
          Start Session
        </h1>
        <div className="flex flex-col gap-5">
          <LinkButton href="/training">
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
    </SessionsContext>
  );
}
