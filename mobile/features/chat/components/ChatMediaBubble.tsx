import { memo, useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Play, ImageOff } from "lucide-react-native";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import VideoPlayerModal from "@/features/notes/components/VideoPlayerModal";
import ChatVoicePlayer from "@/features/chat/components/ChatVoicePlayer";
import { supabase } from "@/lib/supabase";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { ChatMessage } from "@/types/chat";
import { localMediaUriCache } from "@/features/chat/hooks/useSendMediaMessage";
import BodyTextNC from "@/components/BodyTextNC";

// Module-level cache for signed URLs so they survive cell recycling in FlatList.
// Keys are storage paths, values are signed URLs (valid for 1 hour).
const signedUrlCache = new Map<string, string>();

// Cache image dimensions so they survive FlatList recycling — no layout jump on revisit.
const imageDimsCache = new Map<string, { width: number; height: number }>();

const IMG_MAX_WIDTH = 280;
const IMG_MIN_HEIGHT = 150;
const IMG_MAX_HEIGHT = 350;

function computeImageSize(dims: { width: number; height: number } | null) {
  if (!dims) return { width: IMG_MAX_WIDTH, height: IMG_MAX_WIDTH };
  const aspect = dims.height / dims.width;
  const height = Math.round(IMG_MAX_WIDTH * aspect);
  return {
    width: IMG_MAX_WIDTH,
    height: Math.min(IMG_MAX_HEIGHT, Math.max(IMG_MIN_HEIGHT, height)),
  };
}

function getCachedUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  return signedUrlCache.get(storagePath) ?? localMediaUriCache.get(storagePath) ?? null;
}

type ChatMediaBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  onLongPress?: (e: import("react-native").GestureResponderEvent) => void;
};

function ChatMediaBubble({ message, isOwn, onLongPress }: ChatMediaBubbleProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    () => message._localMediaUri ?? getCachedUrl(message.media_storage_path),
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    () => message._localThumbnailUri ?? getCachedUrl(message.media_thumbnail_path),
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [imageSize, setImageSize] = useState(() =>
    computeImageSize(imageDimsCache.get(message.id) ?? null)
  );

  const resolveSignedUrl = useCallback(
    async (path: string, setter: (url: string) => void) => {
      // Check cache first
      const cached = signedUrlCache.get(path);
      if (cached) {
        setter(cached);
        return;
      }

      const { data, error } = await supabase.storage
        .from("chat-media")
        .createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        setLoadFailed(true);
        return;
      }
      signedUrlCache.set(path, data.signedUrl);
      setter(data.signedUrl);
    },
    [],
  );

  // Resolve signed URLs for remote media
  useEffect(() => {
    setLoadFailed(false);
    if (message._localMediaUri) {
      setMediaUrl(message._localMediaUri);
    } else if (message.media_storage_path) {
      const cached = getCachedUrl(message.media_storage_path);
      if (cached) {
        setMediaUrl(cached);
      }
      // Always resolve signed URL in background (refreshes cache)
      resolveSignedUrl(message.media_storage_path, (url) => {
        setMediaUrl(url);
        localMediaUriCache.delete(message.media_storage_path!);
      });
    }
  }, [message.media_storage_path, message._localMediaUri, resolveSignedUrl]);

  useEffect(() => {
    if (message._localThumbnailUri) {
      setThumbnailUrl(message._localThumbnailUri);
    } else if (message.media_thumbnail_path) {
      const cached = getCachedUrl(message.media_thumbnail_path);
      if (cached) {
        setThumbnailUrl(cached);
      }
      resolveSignedUrl(message.media_thumbnail_path, (url) => {
        setThumbnailUrl(url);
        localMediaUriCache.delete(message.media_thumbnail_path!);
      });
    }
  }, [message.media_thumbnail_path, message._localThumbnailUri, resolveSignedUrl]);

  const handleRetry = useCallback(() => {
    setLoadFailed(false);
    setMediaUrl(null);
    setThumbnailUrl(null);
    if (message.media_storage_path) {
      signedUrlCache.delete(message.media_storage_path);
      resolveSignedUrl(message.media_storage_path, setMediaUrl);
    }
    if (message.media_thumbnail_path) {
      signedUrlCache.delete(message.media_thumbnail_path);
      resolveSignedUrl(message.media_thumbnail_path, setThumbnailUrl);
    }
  }, [message.media_storage_path, message.media_thumbnail_path, resolveSignedUrl]);

  // Failed state — tap to retry
  const failedPlaceholder = (
    <AnimatedButton onPress={handleRetry}>
      <View style={{ width: 280, height: 200 }} className="rounded-xl overflow-hidden bg-slate-700 items-center justify-center">
        <ImageOff color="#94a3b8" size={32} />
        <BodyText className="text-xs text-slate-400 mt-1">Tap to retry</BodyText>
      </View>
    </AnimatedButton>
  );

  // Image rendering
  if (message.message_type === "image") {
    if (loadFailed && !message._isUploading) return failedPlaceholder;

    return (
      <>
        <AnimatedButton onPress={() => mediaUrl && setImageViewerVisible(true)} onLongPress={onLongPress} delayLongPress={400}>
          <View style={imageSize} className="rounded-xl overflow-hidden bg-slate-700">
            {mediaUrl && (
              <Image
                source={{ uri: mediaUrl }}
                recyclingKey={message.id}
                className="absolute inset-0"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onLoad={(e) => {
                  const dims = { width: e.source.width, height: e.source.height };
                  imageDimsCache.set(message.id, dims);
                  setImageSize(computeImageSize(dims));
                }}
              />
            )}
            {(!mediaUrl || message._isUploading) && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator color="white" size="large" />
              </View>
            )}
          </View>
        </AnimatedButton>

        {mediaUrl && (
          <ImageViewerModal
            images={[{ id: message.id, uri: mediaUrl }]}
            initialIndex={0}
            visible={imageViewerVisible}
            onClose={() => setImageViewerVisible(false)}
          />
        )}
      </>
    );
  }

  // Video rendering
  if (message.message_type === "video") {
    if (loadFailed && !message._isUploading) return failedPlaceholder;

    const displayThumbnail = thumbnailUrl ?? mediaUrl;

    return (
      <>
        <AnimatedButton onPress={() => mediaUrl && setVideoPlayerVisible(true)} onLongPress={onLongPress} delayLongPress={400}>
          <View style={{ width: 280, height: 200 }} className="rounded-xl overflow-hidden bg-slate-700">
            {displayThumbnail && (
              <Image
                source={{ uri: displayThumbnail }}
                recyclingKey={message.id}
                className="absolute inset-0"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            )}
            {message._isUploading ? (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator color="white" size="large" />
              </View>
            ) : !displayThumbnail ? (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator color="#94a3b8" />
              </View>
            ) : (
              <View className="absolute inset-0 items-center justify-center">
                <View className="bg-black/50 rounded-full p-2">
                  <Play color="white" size={32} fill="white" />
                </View>
              </View>
            )}
            {message.media_duration_ms != null && (
              <View className="absolute bottom-2 left-2 bg-black/60 rounded px-1.5 py-0.5">
                <BodyText className="text-xs">
                  {formatDurationNotesVoice(message.media_duration_ms)}
                </BodyText>
              </View>
            )}
          </View>
        </AnimatedButton>

        {mediaUrl && (
          <VideoPlayerModal
            uri={mediaUrl}
            visible={videoPlayerVisible}
            onClose={() => setVideoPlayerVisible(false)}
          />
        )}
      </>
    );
  }

  // Voice rendering
  if (message.message_type === "voice") {
    if (loadFailed) {
      return (
        <AnimatedButton onPress={handleRetry}>
          <View className="w-[200px] h-8 items-center justify-center">
            <BodyTextNC className="text-xs text-slate-400">Tap to retry</BodyTextNC>
          </View>
        </AnimatedButton>
      );
    }
    if (!mediaUrl) {
      return (
        <View className="w-[200px] h-8 items-center justify-center">
          <ActivityIndicator color="#94a3b8" size="small" />
        </View>
      );
    }
    return (
      <View className="w-[200px]">
        <ChatVoicePlayer
          uri={mediaUrl}
          durationMs={message.media_duration_ms}
          isOwn={isOwn}
        />
      </View>
    );
  }

  return null;
}

export default memo(ChatMediaBubble);
