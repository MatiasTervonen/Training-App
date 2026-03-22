"use client";

import { Users, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";

type FeedMode = "my" | "friends";

type Props = {
  feedMode: FeedMode;
  setFeedMode: (mode: FeedMode) => void;
};

export default function FeedModeToggle({ feedMode, setFeedMode }: Props) {
  const { t } = useTranslation("social");

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setFeedMode("my")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm cursor-pointer transition-colors ${
          feedMode === "my"
            ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-300"
            : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-300"
        }`}
      >
        <LayoutDashboard size={16} />
        {t("social.myFeed")}
      </button>
      <button
        onClick={() => setFeedMode("friends")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm cursor-pointer transition-colors ${
          feedMode === "friends"
            ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-300"
            : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-slate-300"
        }`}
      >
        <Users size={16} />
        {t("social.friendsFeed")}
      </button>
    </div>
  );
}
