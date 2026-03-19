import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useRef } from "react";
import { sendMessage } from "@/database/chat/send-message";
import { ChatMessage } from "@/types/chat";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";
import {
  uploadFileToStorage,
  getAccessToken,
} from "@/lib/upload-with-progress";
import * as Crypto from "expo-crypto";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type SendMediaParams = {
  messageType: "image" | "video" | "voice";
  uri: string;
  thumbnailUri?: string;
  durationMs?: number;
};

// Module-level cache: maps storagePath → localFileUri so ChatMediaBubble
// can show the local image instantly while the signed URL resolves.
export const localMediaUriCache = new Map<string, string>();

export default function useSendMediaMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation("chat");
  const uploadedPathsRef = useRef<string[]>([]);

  return useMutation({
    mutationFn: async ({
      messageType,
      uri,
      thumbnailUri,
      durationMs,
    }: SendMediaParams) => {
      uploadedPathsRef.current = [];

      const accessToken = await getAccessToken();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Unauthorized");

      let mediaStoragePath: string | null = null;
      let mediaThumbnailPath: string | null = null;

      if (messageType === "image") {
        const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const contentType = ext === "png" ? "image/png" : "image/jpeg";
        const storagePath = `${userId}/images/${Crypto.randomUUID()}.${ext}`;
        await uploadFileToStorage(
          "chat-media",
          storagePath,
          uri,
          contentType,
          accessToken,
        );
        uploadedPathsRef.current.push(storagePath);
        localMediaUriCache.set(storagePath, uri);
        mediaStoragePath = storagePath;
      } else if (messageType === "video") {
        const videoPath = `${userId}/videos/${Crypto.randomUUID()}.mp4`;
        await uploadFileToStorage(
          "chat-media",
          videoPath,
          uri,
          "video/mp4",
          accessToken,
        );
        uploadedPathsRef.current.push(videoPath);
        localMediaUriCache.set(videoPath, uri);
        mediaStoragePath = videoPath;

        if (thumbnailUri) {
          const thumbPath = `${userId}/videos/${Crypto.randomUUID()}-thumb.jpg`;
          await uploadFileToStorage(
            "chat-media",
            thumbPath,
            thumbnailUri,
            "image/jpeg",
            accessToken,
          );
          uploadedPathsRef.current.push(thumbPath);
          localMediaUriCache.set(thumbPath, thumbnailUri);
          mediaThumbnailPath = thumbPath;
        }
      } else if (messageType === "voice") {
        const voicePath = `${userId}/voice/${Crypto.randomUUID()}.m4a`;
        await uploadFileToStorage(
          "chat-media",
          voicePath,
          uri,
          "audio/m4a",
          accessToken,
        );
        uploadedPathsRef.current.push(voicePath);
        localMediaUriCache.set(voicePath, uri);
        mediaStoragePath = voicePath;
      }

      const messageId = await sendMessage({
        conversationId,
        messageType,
        mediaStoragePath,
        mediaThumbnailPath,
        mediaDurationMs: durationMs ?? null,
      });

      return messageId;
    },

    onMutate: async ({ messageType, uri, thumbnailUri, durationMs }) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      const previousMessages =
        queryClient.getQueryData<InfiniteData<ChatMessage[]>>([
          "messages",
          conversationId,
        ]);

      const profile = useUserStore.getState().profile;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: session?.user?.id ?? "",
        content: null,
        message_type: messageType,
        media_storage_path: null,
        media_thumbnail_path: null,
        media_duration_ms: durationMs ?? null,
        link_preview: null,
        created_at: new Date().toISOString(),
        sender_display_name: profile?.display_name ?? "",
        sender_profile_picture: profile?.profile_picture ?? null,
        _localMediaUri: uri,
        _localThumbnailUri: thumbnailUri,
        _isUploading: true,
      };

      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        ["messages", conversationId],
        (old) => {
          if (!old) {
            return {
              pages: [[optimisticMessage]],
              pageParams: [undefined],
            };
          }
          const newPages = [...old.pages];
          newPages[0] = [optimisticMessage, ...(newPages[0] ?? [])];
          return { ...old, pages: newPages };
        },
      );

      return { previousMessages };
    },

    onError: (err, _variables, context) => {
      console.error("Send media message error:", err);
      Toast.show({
        type: "error",
        text1: t("chat.mediaUploadError"),
      });

      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages,
        );
      }

      // Best-effort cleanup of uploaded files
      const pathsToClean = [...uploadedPathsRef.current];
      if (pathsToClean.length > 0) {
        void supabase.storage
          .from("chat-media")
          .remove(pathsToClean)
          .catch(() => {
            // Ignore cleanup errors
          });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["total-unread-count"] });
    },
  });
}
