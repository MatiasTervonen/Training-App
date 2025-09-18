"use client";

import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { TemplateSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import Modal from "@/app/(app)/components/modal";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import toast from "react-hot-toast";
import TimerCard from "../components/TimerCard";
import { useTimerStore } from "../../lib/stores/timerStore";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { timers } from "@/app/(app)/types/models";

export default function TimersPage() {
  const [expandedItem, setExpandedItem] = useState<timers | null>(null);

  const router = useRouter();

  const {
    data: timer = [],
    error,
    isLoading,
  } = useSWR<timers[]>("/api/timer/get-timer", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const { startTimer, setActiveSession } = useTimerStore();

  const handleDeleteTimer = async (timerId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmDelete) return;

    mutate(
      "/api/timer/get-timer",
      (currentTimers: timers[] = []) => {
        return currentTimers.filter((t) => t.id !== timerId);
      },
      false
    );

    try {
      const res = await fetch("/api/timer/delete-timer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: timerId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete timer");
      }

      await res.json();

      mutate("/api/timer/get-timer");
    } catch (error) {
      toast.error("Failed to delete timer. Please try again.");
      mutate("/api/timer/get-timer");
      console.error("Failed to delete timer:", error);
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
    <ModalPageWrapper
      leftLabel="back"
      rightLabel="home"
      onSwipeRight={() => router.back()}
      onSwipeLeft={() => router.push("/dashboard")}
    >
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100 p-5`}
      >
        <div className="flex flex-col max-w-md mx-auto">
          <h1
            className={`${russoOne.className} text-gray-100 text-center  my-5 text-2xl `}
          >
            My Timers
          </h1>

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
                className={`${russoOne.className} text-gray-100 text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                onClick={() => setExpandedItem(timer)}
              >
                {timer.title}
              </div>
            ))}

          {expandedItem && (
            <Modal
              isOpen={true}
              onClose={() => setExpandedItem(null)}
            >
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
      </div>
    </ModalPageWrapper>
  );
}
