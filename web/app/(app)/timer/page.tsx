"use client";

import LinkButton from "../components/buttons/LinkButton";
import toast from "react-hot-toast";
import { useTimerStore } from "../lib/stores/timerStore";
import { List } from "lucide-react";

export default function TimerPage() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = (e: React.MouseEvent) => {
    if (activeSession) {
      e.preventDefault();
      toast.error(
        "You already have an active session. Finish it before starting a new one."
      );
      return;
    }
  };

  return (
    <div className="page-padding max-w-md mx-auto">
      <h1 className="text-2xl text-center mb-10">Timer</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href="/timer/empty-timer" onClick={handleClick}>
          Start Timer
        </LinkButton>
        <LinkButton href="/timer/create-timer">Create Timer</LinkButton>
        <LinkButton href="/timer/my-timers">
        <p>My-Timers</p>
        <List />
        </LinkButton>
      </div>
    </div>
  );
}
