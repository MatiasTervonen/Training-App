import { memo } from "react";
import { View, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Check, CheckCheck } from "lucide-react-native";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import ChatMediaBubble from "@/features/chat/components/ChatMediaBubble";
import LinkPreviewCard from "@/features/chat/components/LinkPreviewCard";
import ReplyPreview from "@/features/chat/components/ReplyPreview";
import ReactionPills from "@/features/chat/components/ReactionPills";
import MessageToolbar from "@/features/chat/components/MessageToolbar";
import AnimatedButton from "@/components/buttons/animatedButton";
import { parseMessageWithLinks } from "@/lib/chat/linkUtils";
import { ChatMessage } from "@/types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp: boolean;
  isSelected?: boolean;
  onLongPress?: (message: ChatMessage) => void;
  onDismiss?: () => void;
  onReplyPress?: (messageId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onToolbarReaction?: (emoji: string) => void;
  isHighlighted?: boolean;
  isRead?: boolean;
};

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatBubble({
  message,
  isOwn,
  showTimestamp,
  isSelected,
  onLongPress,
  onDismiss,
  onReplyPress,
  onToggleReaction,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onToolbarReaction,
  isHighlighted,
  isRead,
}: ChatBubbleProps) {
  const { t } = useTranslation("chat");
  const isMedia = message.message_type !== "text";
  const isDeleted = !!message.deleted_at;
  const timeString = showTimestamp ? formatMessageTime(message.created_at) : null;

  const readReceiptIcon = isOwn && !isDeleted && showTimestamp ? (
    isRead ? (
      <CheckCheck size={14} color="#22d3ee" />
    ) : (
      <Check size={14} color="#94a3b8" />
    )
  ) : null;

  return (
    <View className={isHighlighted ? "bg-cyan-500/10" : undefined}>
      <View className={`px-4 mb-1 ${isOwn ? "items-end" : "items-start"}`}>
        <AnimatedButton
          onPress={() => onDismiss?.()}
          onLongPress={() => {
            if (!isDeleted && onLongPress) onLongPress(message);
          }}
          delayLongPress={400}
          className={`max-w-[80%] rounded-2xl ${
            isDeleted
              ? "px-3 py-1.5"
              : message.message_type === "voice"
                ? "px-4 py-3"
                : isMedia
                  ? "p-1"
                  : "px-3 py-1.5"
          } ${
            isOwn
              ? "bg-cyan-800 rounded-br-sm"
              : "bg-slate-700 rounded-bl-sm"
          }`}
        >
          {isDeleted ? (
            <View className="flex-row items-end gap-2">
              <BodyTextNC className="text-sm italic text-slate-400 flex-shrink">
                {t("chat.messageDeleted")}
              </BodyTextNC>
              {timeString && (
                <BodyTextNC className="text-[10px] text-slate-400/70 mb-px">
                  {timeString}
                </BodyTextNC>
              )}
            </View>
          ) : (
            <>
              {message.reply_to_message_id && (
                <ReplyPreview
                  senderName={message.reply_to_sender_name}
                  content={message.reply_to_content}
                  messageType={message.reply_to_message_type}
                  isDeleted={!!message.reply_to_deleted_at}
                  isOwn={isOwn}
                  onPress={() =>
                    onReplyPress?.(message.reply_to_message_id!)
                  }
                />
              )}
              {isMedia ? (
                <View>
                  <ChatMediaBubble
                    message={message}
                    isOwn={isOwn}
                    onLongPress={() => onLongPress?.(message)}
                  />
                  {timeString && message.message_type === "voice" ? (
                    <View className="flex-row items-center self-end gap-1 mt-0.5">
                      <BodyTextNC
                        className={`text-[10px] ${
                          isOwn ? "text-cyan-200/60" : "text-slate-400/70"
                        }`}
                      >
                        {timeString}
                      </BodyTextNC>
                      {readReceiptIcon}
                    </View>
                  ) : timeString ? (
                    <View className="absolute bottom-1.5 right-1.5 bg-black/50 rounded px-1 py-0.5 flex-row items-center gap-1">
                      <BodyTextNC className="text-[10px] text-white/80">
                        {timeString}
                      </BodyTextNC>
                      {readReceiptIcon}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View>
                  <BodyText className="text-base text-slate-100">
                    {parseMessageWithLinks(message.content ?? "").map(
                      (segment, i) =>
                        segment.isUrl ? (
                          <BodyTextNC
                            key={i}
                            className="text-base text-cyan-300 underline"
                            onPress={() => Linking.openURL(segment.text)}
                          >
                            {segment.text}
                          </BodyTextNC>
                        ) : (
                          segment.text
                        ),
                    )}
                  </BodyText>
                  {message.link_preview && (
                    <LinkPreviewCard
                      preview={message.link_preview}
                      isOwn={isOwn}
                    />
                  )}
                  {timeString && (
                    <View className="flex-row items-center self-end gap-1 mt-0.5">
                      <BodyTextNC
                        className={`text-[10px] ${
                          isOwn ? "text-cyan-200/60" : "text-slate-400/70"
                        }`}
                      >
                        {timeString}
                      </BodyTextNC>
                      {readReceiptIcon}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </AnimatedButton>
      </View>

      {/* Inline toolbar below the selected bubble */}
      {isSelected && onReply && onCopy && onForward && onDelete && onToolbarReaction && (
        <MessageToolbar
          message={message}
          isOwn={isOwn}
          onReply={onReply}
          onCopy={onCopy}
          onForward={onForward}
          onDelete={onDelete}
          onReaction={onToolbarReaction}
        />
      )}

      {!isDeleted && (
        <ReactionPills
          reactions={message.reactions ?? []}
          onToggle={(emoji) => onToggleReaction?.(message.id, emoji)}
          alignRight={isOwn}
        />
      )}
    </View>
  );
}

export default memo(ChatBubble);
