"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useTypingIndicator(conversationId: string, currentUserId: string | null) {
  const queryClient = useQueryClient();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, () => {
        setIsOtherTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
      })
      .on("broadcast", { event: "stop_typing" }, () => {
        setIsOtherTyping(false);
        clearTimeout(typingTimeoutRef.current);
      })
      .on("broadcast", { event: "read" }, () => {
        queryClient.invalidateQueries({ queryKey: ["other-last-read", conversationId] });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, queryClient]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId } });
  }, [currentUserId]);

  const stopTyping = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "stop_typing", payload: { userId: currentUserId } });
  }, [currentUserId]);

  const broadcastRead = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "read", payload: { userId: currentUserId } });
  }, [currentUserId]);

  return { isOtherTyping, sendTyping, stopTyping, broadcastRead };
}
