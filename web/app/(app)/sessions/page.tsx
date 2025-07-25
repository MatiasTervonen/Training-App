import { NotebookPen, Dumbbell, Disc, Timer, Weight } from "lucide-react";
import ModalPageWrapper from "../components/modalPageWrapper";
import SessionsContext from "./components/SessionContext";
import LinkButton from "../ui/LinkButton";

export default function Sessions() {
  return (
    <ModalPageWrapper>
      <div className="p-5 h-full">
        <h1 className=" text-gray-100 text-center  my-5 text-2xl ">
          Start Session
        </h1>
        <div className="flex flex-col max-w-md mx-auto">
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
        </div>
        <SessionsContext />
      </div>
    </ModalPageWrapper>
  );
}
