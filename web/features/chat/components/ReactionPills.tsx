"use client";

import { ReactionSummary } from "@/types/chat";

type ReactionPillsProps = {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
};

export default function ReactionPills({ reactions, onToggle }: ReactionPillsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
            r.user_reacted
              ? "bg-cyan-500/20 border-cyan-500/50"
              : "bg-slate-800 border-slate-600 hover:border-slate-500"
          }`}
        >
          {r.emoji} {r.count}
        </button>
      ))}
    </div>
  );
}
