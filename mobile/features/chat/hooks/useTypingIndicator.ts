import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function useTypingIndicator(
  conversationId: string,
  currentUserId: string | null,
) {
  const queryClient = useQueryClient();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`chat-typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const senderId = payload.payload?.userId as string | undefined;
        if (!senderId || senderId === currentUserId) return;

        setIsOtherTyping(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 3000);
      })
      .on("broadcast", { event: "stop_typing" }, () => {
        setIsOtherTyping(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      })
      .on("broadcast", { event: "read" }, (payload) => {
        const senderId = payload.payload?.userId as string | undefined;
        if (!senderId || senderId === currentUserId) return;

        queryClient.invalidateQueries({
          queryKey: ["other-last-read", conversationId],
        });
      })
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, queryClient]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;

    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }, [currentUserId]);

  const stopTyping = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "stop_typing",
      payload: {},
    });
  }, []);

  const broadcastRead = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "read",
      payload: { userId: currentUserId },
    });
  }, [currentUserId]);

  return { isOtherTyping, sendTyping, stopTyping, broadcastRead };
}
