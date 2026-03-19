import { useState, useCallback, useRef, useEffect } from "react";
import { View, TextInput, Keyboard } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Send, Plus, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import ChatMediaPreview from "@/features/chat/components/ChatMediaPreview";
import LinkPreviewCard from "@/features/chat/components/LinkPreviewCard";
import { extractFirstUrl } from "@/lib/chat/linkUtils";
import { fetchLinkPreviewOnly } from "@/database/chat/fetch-link-preview";
import type { MessageType, LinkPreview } from "@/types/chat";
import type { DraftVideo } from "@/types/session";

type MediaPayload = {
  messageType: Exclude<MessageType, "text">;
  uri: string;
  thumbnailUri?: string;
  durationMs?: number;
};

type ChatInputProps = {
  onSend: (content: string, preview?: LinkPreview | null) => void;
  onSendMedia: (payload: MediaPayload) => void;
  disabled?: boolean;
  disabledMessage?: string;
};

export default function ChatInput({
  onSend,
  onSendMedia,
  disabled = false,
  disabledMessage,
}: ChatInputProps) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaPayload | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [inputPreview, setInputPreview] = useState<LinkPreview | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const lastFetchedUrl = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect URL in text and fetch preview with debounce
  useEffect(() => {
    const url = extractFirstUrl(text);

    if (!url) {
      setInputPreview(null);
      lastFetchedUrl.current = null;
      setPreviewDismissed(false);
      return;
    }

    // Already fetched this URL or user dismissed it
    if (url === lastFetchedUrl.current || previewDismissed) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      lastFetchedUrl.current = url;
      const preview = await fetchLinkPreviewOnly(url);
      setInputPreview(preview);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [text, previewDismissed]);

  const handleSend = useCallback(() => {
    if (pendingMedia) {
      if (isCompressing) return;
      if (!pendingMedia.uri) return;
      onSendMedia(pendingMedia);
      setPendingMedia(null);
      setShowToolbar(false);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, inputPreview);
    setText("");
    setInputPreview(null);
    lastFetchedUrl.current = null;
    setPreviewDismissed(false);
  }, [text, disabled, onSend, onSendMedia, pendingMedia, isCompressing, inputPreview]);

  const handleImageSelected = useCallback(
    (image: { id: string; uri: string; isLoading: boolean }) => {
      if (image.isLoading) {
        setPendingMedia({
          messageType: "image",
          uri: "",
        });
        setIsCompressing(true);
        return;
      }
      if (!image.uri) {
        setPendingMedia(null);
        setIsCompressing(false);
        return;
      }
      setPendingMedia({
        messageType: "image",
        uri: image.uri,
      });
      setIsCompressing(false);
      Keyboard.dismiss();
    },
    [],
  );

  const handleVideoSelected = useCallback((video: DraftVideo) => {
    if (!video.uri && !video.isCompressing) {
      setPendingMedia(null);
      setIsCompressing(false);
      return;
    }
    setPendingMedia({
      messageType: "video",
      uri: video.uri,
      thumbnailUri: video.thumbnailUri,
      durationMs: video.durationMs,
    });
    setIsCompressing(video.isCompressing ?? false);
    Keyboard.dismiss();
  }, []);

  const handleRecordingComplete = useCallback(
    (uri: string, durationMs: number) => {
      setPendingMedia({
        messageType: "voice",
        uri,
        durationMs,
      });
      Keyboard.dismiss();
    },
    [],
  );

  const handleCancelMedia = useCallback(() => {
    setPendingMedia(null);
    setIsCompressing(false);
  }, []);

  const hasPendingMedia = pendingMedia !== null;
  const canSend = hasPendingMedia
    ? !isCompressing && !!pendingMedia.uri
    : !!text.trim();

  if (disabled && disabledMessage) {
    return (
      <View className="px-4 py-3 border-t border-slate-700 bg-slate-900">
        <View className="bg-slate-800 rounded-xl px-4 py-3">
          <TextInput
            value=""
            placeholder={disabledMessage}
            placeholderTextColor="#64748b"
            editable={false}
            className="text-slate-400 text-base font-lexend"
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      {inputPreview && !pendingMedia && (
        <View className="px-4 pt-2 bg-slate-900 border-t border-slate-700">
          <View className="relative">
            <LinkPreviewCard preview={inputPreview} isOwn />
            <AnimatedButton
              onPress={() => {
                setInputPreview(null);
                setPreviewDismissed(true);
              }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-800/80 items-center justify-center"
            >
              <X color="#94a3b8" size={14} />
            </AnimatedButton>
          </View>
        </View>
      )}

      {pendingMedia && (
        <ChatMediaPreview
          type={pendingMedia.messageType}
          uri={pendingMedia.uri}
          thumbnailUri={pendingMedia.thumbnailUri}
          durationMs={pendingMedia.durationMs}
          isCompressing={isCompressing}
          onCancel={handleCancelMedia}
        />
      )}

      <View className="px-4 py-2 border-t border-slate-700 bg-slate-900 flex-row items-end gap-2">
        <AnimatedButton
          onPress={() => {
            setShowToolbar((prev) => !prev);
            Keyboard.dismiss();
          }}
          className="w-[44px] h-[44px] rounded-full items-center justify-center bg-slate-800"
        >
          <Plus color={showToolbar ? "#06b6d4" : "#94a3b8"} size={22} />
        </AnimatedButton>

        <View className="flex-1 bg-slate-800 rounded-2xl px-4 min-h-[44px] justify-center max-h-[120px]">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("chat.typeMessage")}
            placeholderTextColor="#64748b"
            multiline
            maxLength={2000}
            className="text-slate-100 text-[15px] font-lexend py-2.5"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!hasPendingMedia}
          />
        </View>

        <AnimatedButton
          onPress={handleSend}
          className="w-[44px] h-[44px] rounded-full items-center justify-center bg-slate-800 border-[1.5px] border-cyan-500/40"
          disabled={!canSend}
        >
          <Send color="#06b6d4" size={20} />
        </AnimatedButton>
      </View>

      {showToolbar && !hasPendingMedia && (
        <View className="px-4 pb-2 bg-slate-900">
          <MediaToolbar
            onRecordingComplete={handleRecordingComplete}
            onImageSelected={handleImageSelected}
            onVideoSelected={handleVideoSelected}
            showFolderButton={false}
            recordLabel={t("chat.recordVoiceMessage")}
          />
        </View>
      )}
    </View>
  );
}
