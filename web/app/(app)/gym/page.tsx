"use client";

import LinkButton from "../components/buttons/LinkButton";
import { useTimerStore } from "../lib/stores/timerStore";
import toast from "react-hot-toast";
import { List, ChartNoAxesCombined } from "lucide-react";

export default function TrainingPage() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession && activeSession?.type !== "gym") {
      e.preventDefault();
      toast.error(
        "You already have an active session. Finish it before starting a new one.",
      );
      return;
    }
  };

  return (
    <div className="page-padding">
      <h1 className="text-2xl mb-10 text-center">Gym Sessions</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href={"/gym/gym"} onClick={handleClick}>
          Start empty workout
        </LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/create-template"}>Create template</LinkButton>
        <LinkButton href={"/gym/templates"}>Templates</LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/add-exercise"}>Add Exercise</LinkButton>
        <LinkButton href={"/gym/edit-exercises"}>Edit Exercise</LinkButton>
        <div className="border border-gray-400 rounded-md" />
        <LinkButton href={"/gym/workout-analytics"}>
          <p>Workout Analytics</p>
          <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
        </LinkButton>
        <LinkButton href={"/gym/my-sessions"}>
          <p>My-Sessions</p>
          <List color="#f3f4f6" className="ml-2" />
        </LinkButton>
      </div>
    </div>
  );
}
