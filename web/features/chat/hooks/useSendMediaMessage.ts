"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage, MessageType } from "@/types/chat";
import { createClient } from "@/utils/supabase/client";
import {
  uploadChatMedia,
  compressImage,
  generateVideoThumbnail,
  getVideoDurationMs,
  deleteChatMedia,
} from "@/lib/chat/upload-chat-media";

type MediaMessageParams = {
  messageType: "image" | "video" | "voice";
  file: File;
  localPreviewUrl: string;
  durationMs?: number;
};

export function useSendMediaMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageType, file, durationMs }: MediaMessageParams) => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      if (typeof userId !== "string") throw new Error("Not authenticated");

      const uuid = crypto.randomUUID();
      let storagePath: string;
      let thumbnailPath: string | null = null;
      let finalDurationMs: number | null = durationMs ?? null;
      const uploadedPaths: string[] = [];

      try {
        if (messageType === "image") {
          const compressed = await compressImage(file);
          storagePath = `${userId}/images/${uuid}.jpg`;
          await uploadChatMedia(compressed, storagePath);
          uploadedPaths.push(storagePath);
        } else if (messageType === "video") {
          storagePath = `${userId}/videos/${uuid}.mp4`;
          await uploadChatMedia(file, storagePath);
          uploadedPaths.push(storagePath);

          try {
            const thumbFile = await generateVideoThumbnail(file);
            thumbnailPath = `${userId}/videos/${uuid}-thumb.jpg`;
            await uploadChatMedia(thumbFile, thumbnailPath);
            uploadedPaths.push(thumbnailPath);
          } catch {
            // Thumbnail is optional — continue without it
          }

          if (!finalDurationMs) {
            try {
              finalDurationMs = await getVideoDurationMs(file);
            } catch {
              // Duration is optional
            }
          }
        } else {
          storagePath = `${userId}/voice/${uuid}.webm`;
          await uploadChatMedia(file, storagePath);
          uploadedPaths.push(storagePath);
        }

        const messageId = await sendMessage({
          conversationId,
          messageType,
          mediaStoragePath: storagePath,
          mediaThumbnailPath: thumbnailPath,
          mediaDurationMs: finalDurationMs,
        });

        return messageId;
      } catch (err) {
        // Clean up uploaded files on failure
        if (uploadedPaths.length > 0) {
          deleteChatMedia(uploadedPaths).catch(() => {});
        }
        throw err;
      }
    },

    onMutate: async ({ messageType, localPreviewUrl }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);

      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const sub = data?.claims?.sub;

      const tempMessage: ChatMessage = {
        id: `temp-media-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: typeof sub === "string" ? sub : "",
        content: null,
        message_type: messageType as MessageType,
        created_at: new Date().toISOString(),
        sender_display_name: "",
        sender_profile_picture: null,
        media_storage_path: localPreviewUrl,
        media_thumbnail_path: null,
        media_duration_ms: null,
        link_preview: null,
        deleted_at: null,
        reply_to_message_id: null,
        reply_to_content: null,
        reply_to_sender_name: null,
        reply_to_message_type: null,
        reply_to_deleted_at: null,
        reactions: [],
        _isUploading: true,
        _localPreviewUrl: localPreviewUrl,
      };

      queryClient.setQueryData(["messages", conversationId], (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: ChatMessage[][]; pageParams: unknown[] };
        return {
          ...data,
          pages: [[tempMessage, ...data.pages[0]], ...data.pages.slice(1)],
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", conversationId], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
