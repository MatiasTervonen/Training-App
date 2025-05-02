"use client";

import { useEffect } from "react";

type TimerProps = {
  isRunning: boolean;
  seconds: number;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
};

export default function Timer({ isRunning, seconds, setSeconds }: TimerProps) {
  useEffect(() => {
    if (!isRunning) return; // if not running, do nothing

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // cleanup
  }, [isRunning, setSeconds]); // rerun this only when isRunning changes

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="text-gray-100 font-bold text-lg">{formatTime(seconds)}</div>
  );
}
