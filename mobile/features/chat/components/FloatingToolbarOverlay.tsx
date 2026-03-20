import { Pressable, useWindowDimensions } from "react-native";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import MessageToolbar from "@/features/chat/components/MessageToolbar";
import { ChatMessage } from "@/types/chat";

export type BubbleLayout = {
  pageY: number;
};

type FloatingToolbarOverlayProps = {
  message: ChatMessage | null;
  isOwn: boolean;
  bubbleLayout: BubbleLayout | null;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onDismiss: () => void;
};

const TOOLBAR_HEIGHT = 140;
const MARGIN = 12;

export default function FloatingToolbarOverlay({
  message,
  isOwn,
  bubbleLayout,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onReaction,
  onDismiss,
}: FloatingToolbarOverlayProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!message || !bubbleLayout) return null;

  const touchY = bubbleLayout.pageY;
  const spaceAbove = touchY - insets.top;
  const spaceBelow = screenHeight - touchY - insets.bottom;

  // Place toolbar above the touch point if there's room, otherwise below
  const top = spaceAbove > TOOLBAR_HEIGHT + MARGIN
    ? touchY - TOOLBAR_HEIGHT - MARGIN
    : touchY + MARGIN;

  // Clamp so toolbar stays on screen
  const clampedTop = Math.max(
    insets.top + MARGIN,
    Math.min(top, screenHeight - insets.bottom - TOOLBAR_HEIGHT - MARGIN),
  );

  return (
    <Portal>
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(100)}
        className="absolute inset-0 z-50"
      >
        {/* Backdrop */}
        <Pressable
          onPress={onDismiss}
          className="absolute inset-0 bg-black/30"
        />

        {/* Toolbar */}
        <Animated.View
          style={{
            position: "absolute",
            top: clampedTop,
            ...(isOwn ? { right: 16 } : { left: 16 }),
          }}
        >
          <MessageToolbar
            message={message}
            isOwn={isOwn}
            onReply={onReply}
            onCopy={onCopy}
            onForward={onForward}
            onDelete={onDelete}
            onReaction={onReaction}
          />
        </Animated.View>
      </Animated.View>
    </Portal>
  );
}
