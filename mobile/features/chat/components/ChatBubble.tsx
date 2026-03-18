import { memo } from "react";
import { View } from "react-native";
import BodyText from "@/components/BodyText";
import { ChatMessage } from "@/types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp: boolean;
};

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatBubble({ message, isOwn, showTimestamp }: ChatBubbleProps) {
  return (
    <View
      className={`px-4 mb-1 ${isOwn ? "items-end" : "items-start"}`}
    >
      <View
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          isOwn
            ? "bg-blue-600 rounded-br-sm"
            : "bg-slate-700 rounded-bl-sm"
        }`}
      >
        <BodyText className="text-base text-slate-100">
          {message.content}{"  "}
        </BodyText>
      </View>
      {showTimestamp && (
        <BodyText className="text-[10px] text-slate-500 mt-0.5 px-1">
          {formatMessageTime(message.created_at)}
        </BodyText>
      )}
    </View>
  );
}

export default memo(ChatBubble);
