"use client";

import { Users, LayoutDashboard } from "lucide-react";

type FeedMode = "my" | "friends";

type Props = {
  feedMode: FeedMode;
  setFeedMode: (mode: FeedMode) => void;
};

export default function FeedModeToggle({ feedMode, setFeedMode }: Props) {
  const isFriends = feedMode === "friends";

  return (
    <div className="absolute bottom-8 right-6 z-50">
      <div className="absolute -inset-0.5 rounded-full bg-blue-400/20" />
      <div className="absolute -inset-2 rounded-full bg-blue-400/10" />
      <div className="absolute -inset-3.5 rounded-full bg-blue-400/5" />
      <button
        onClick={() => setFeedMode(isFriends ? "my" : "friends")}
        className="relative w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 border-[1.5px] border-blue-400/60 shadow-xl shadow-blue-400/60 cursor-pointer transition-colors hover:bg-slate-700"
      >
        {isFriends ? (
          <LayoutDashboard size={26} className="text-blue-400" />
        ) : (
          <Users size={26} className="text-blue-400" />
        )}
      </button>
    </div>
  );
}
