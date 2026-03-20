import { memo } from "react";
import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyTextNC from "@/components/BodyTextNC";
import { ReactionSummary } from "@/types/chat";

type ReactionPillsProps = {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
  alignRight: boolean;
};

function ReactionPills({ reactions, onToggle, alignRight }: ReactionPillsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View
      className={`flex-row flex-wrap gap-1 px-4 mt-0.5 mb-1 ${
        alignRight ? "justify-end" : "justify-start"
      }`}
    >
      {reactions.map((reaction) => (
        <AnimatedButton
          key={reaction.emoji}
          onPress={() => onToggle(reaction.emoji)}
          className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
            reaction.user_reacted
              ? "bg-cyan-800/30 border border-cyan-700/50"
              : "bg-slate-700/60 border border-slate-600/50"
          }`}
        >
          <BodyTextNC className="text-sm">{reaction.emoji}</BodyTextNC>
          <BodyTextNC className="text-[11px] text-slate-300">
            {reaction.count}
          </BodyTextNC>
        </AnimatedButton>
      ))}
    </View>
  );
}

export default memo(ReactionPills);
