"use client";

import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import toast from "react-hot-toast";
import TimerCard from "../components/TimerCard";
import { useTimerStore } from "../../lib/stores/timerStore";
import { timers } from "@/app/(app)/types/models";
import { deleteTimer } from "../../database/timer";
import { getTimers } from "../../database/timer";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export default function TimersPage() {
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);

  const router = useRouter();

  const queryClient = useQueryClient();

  const {
    data: timer = [],
    error,
    isLoading,
  } = useQuery<timers[]>({
    queryKey: ["get-timers"],
    queryFn: getTimers,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { startTimer, setActiveSession } = useTimerStore();

  const handleDeleteTimer = async (timerId: string) => {
    const queryKey = ["get-timers"];

    await queryClient.cancelQueries({ queryKey });

    const previousTimers = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<timers[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((t) => t.id !== timerId);
    });

    try {
      await deleteTimer(timerId);

      toast.success("Timer deleted succesfully!");
    } catch {
      queryClient.setQueryData(queryKey, previousTimers);
      toast.error("Failed to delete timer. Please try again.");
    }
  };

  const startSavedTimer = (timer: timers) => {
    localStorage.setItem(
      "timer_session_draft",
      JSON.stringify({
        title: timer.title,
        notes: timer.notes,
        durationInSeconds: timer.time_seconds,
      })
    );

    setActiveSession({
      type: "timer",
      label: timer.title,
      path: "/timer/empty-timer",
    });

    startTimer(timer.time_seconds);
    router.push("/timer/empty-timer");
  };

  return (
    <div className="flex flex-col max-w-md mx-auto pt-5 px-5">
      <h1 className="text-center text-2xl mb-10">My Timers</h1>

      {!error && isLoading && <TemplateSkeleton count={3} />}

      {error && (
        <p className="text-red-500 text-center">
          Error loading timers. Try again!
        </p>
      )}

      {!isLoading && timer.length === 0 && (
        <p className="text-gray-300 text-center">
          No timers found. Create a new timer to get started!
        </p>
      )}

      {timer &&
        timer.map((timer: timers) => (
          <div
            key={timer.id}
            onClick={() => setExpandedItem(timer)}
            className="text-center bg-blue-800 py-2 my-3 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:scale-105 transition-all duration-200"
          >
            {timer.title}
          </div>
        ))}

      {expandedItem && (
        <Modal isOpen={true} onClose={() => setExpandedItem(null)}>
          <TimerCard
            item={expandedItem}
            onDelete={() => {
              handleDeleteTimer(expandedItem.id);
              setExpandedItem(null);
            }}
            onExpand={() => {
              // Handle expand logic here if needed
              console.log("Expand template:", expandedItem.id);
            }}
            onEdit={() => {
              // Handle edit logic here
              console.log("Edit template:", expandedItem.id);
            }}
            onStarTimer={() => startSavedTimer(expandedItem)}
          />
        </Modal>
      )}
    </div>
  );
}
