"use client";

import LinkButton from "../components/buttons/LinkButton";
import { useTimerStore } from "../lib/stores/timerStore";
import toast from "react-hot-toast";

export default function TrainingPage() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession && activeSession?.type !== "gym") {
      e.preventDefault();
      toast.error(
        "You already have an active session. Finish it before starting a new one."
      );
      return;
    }
  };

  return (
    <div className="page-padding">
      <h1 className="text-2xl mb-10 text-center">Gym Session</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href={"/training/gym"} onClick={handleClick}>
          Start empty workout
        </LinkButton>
        <LinkButton href={"/training/create-template"}>
          Create template
        </LinkButton>
        <LinkButton href={"/training/templates"}>Templates</LinkButton>
        <LinkButton href={"/training/add-exercise"}>Add Exercise</LinkButton>
        <LinkButton href={"/training/edit-exercises"}>Edit Exercise</LinkButton>
        <LinkButton href={"/training/workout-analytics"}>
          Workout Analytics
        </LinkButton>
      </div>
    </div>
  );
}
