import {
  View,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useState } from "react";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { Mic, ImagePlus, FolderOpen, Video } from "lucide-react-native";
import * as ExpoImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system/legacy";
import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from "react-native-compressor";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid/non-secure";
import RecordingModal from "@/features/notes/components/RecordingModal";
import type { FolderWithCount } from "@/database/notes/get-folders";
import type { DraftVideo } from "@/types/session";
import { MEDIA_LIMITS } from "@/constants/media-limits";

type Props = {
  onRecordingComplete: (uri: string, durationMs: number) => void;
  onImageSelected: (image: {
    id: string;
    uri: string;
    isLoading: boolean;
  }) => void;
  onVideoSelected?: (video: DraftVideo) => void;
  folders?: FolderWithCount[];
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
  showFolderButton?: boolean;
  currentImageCount?: number;
  currentVideoCount?: number;
  currentVoiceCount?: number;
};

export default function MediaToolbar({
  onRecordingComplete,
  onImageSelected,
  onVideoSelected,
  folders = [],
  selectedFolderId = null,
  onFolderSelect = () => {},
  showFolderButton = true,
  currentImageCount = 0,
  currentVideoCount = 0,
  currentVoiceCount = 0,
}: Props) {
  const { t } = useTranslation(["notes", "common"]);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  const imagesAtLimit = currentImageCount >= MEDIA_LIMITS.MAX_IMAGES;
  const videosAtLimit = currentVideoCount >= MEDIA_LIMITS.MAX_VIDEOS;
  const voiceAtLimit = currentVoiceCount >= MEDIA_LIMITS.MAX_VOICE_RECORDINGS;

  const getFileSizeMB = async (uri: string): Promise<number> => {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && "size" in info) {
      return (info.size ?? 0) / (1024 * 1024);
    }
    return 0;
  };

  const compressImage = async (uri: string): Promise<string> => {
    const compressed = await ImageCompressor.compress(uri, {
      maxWidth: MEDIA_LIMITS.MAX_IMAGE_RESOLUTION,
      maxHeight: MEDIA_LIMITS.MAX_IMAGE_RESOLUTION,
      quality: 0.7,
      output: "jpg",
    });
    return compressed;
  };

  const compressVideo = async (uri: string): Promise<string> => {
    const compressed = await VideoCompressor.compress(uri, {
      maxSize: 720,
      bitrate: 3_000_000,
    });
    return compressed;
  };

  const pickFromLibrary = async () => {
    if (imagesAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxImagesReached", {
          max: MEDIA_LIMITS.MAX_IMAGES,
        }),
      });
      return;
    }

    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes:notes.images.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Reject absurdly large files before attempting compression
      const rawSizeMB = await getFileSizeMB(asset.uri);
      if (rawSizeMB > MEDIA_LIMITS.MAX_IMAGE_RAW_SIZE_MB) {
        Toast.show({
          type: "error",
          text1: t("common:common.media.imageTooLarge", {
            max: MEDIA_LIMITS.MAX_IMAGE_RAW_SIZE_MB,
          }),
        });
        return;
      }

      // Show placeholder immediately, compress in background
      const id = nanoid();
      onImageSelected({ id, uri: "", isLoading: true });
      try {
        const compressedUri = await compressImage(asset.uri);

        // Check file size after compression
        const sizeMB = await getFileSizeMB(compressedUri);
        if (sizeMB > MEDIA_LIMITS.MAX_IMAGE_SIZE_MB) {
          Toast.show({
            type: "error",
            text1: t("common:common.media.imageTooLarge", {
              max: MEDIA_LIMITS.MAX_IMAGE_SIZE_MB,
            }),
          });
          onImageSelected({ id, uri: "", isLoading: false });
          return;
        }

        onImageSelected({ id, uri: compressedUri, isLoading: false });
      } catch {
        onImageSelected({ id, uri: asset.uri, isLoading: false });
      }
    }
  };

  const takePhoto = async () => {
    if (imagesAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxImagesReached", {
          max: MEDIA_LIMITS.MAX_IMAGES,
        }),
      });
      return;
    }

    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes:notes.images.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Show placeholder immediately, compress in background
      const id = nanoid();
      onImageSelected({ id, uri: "", isLoading: true });
      try {
        const compressedUri = await compressImage(asset.uri);

        // Check file size after compression
        const sizeMB = await getFileSizeMB(compressedUri);
        if (sizeMB > MEDIA_LIMITS.MAX_IMAGE_SIZE_MB) {
          Toast.show({
            type: "error",
            text1: t("common:common.media.imageTooLarge", {
              max: MEDIA_LIMITS.MAX_IMAGE_SIZE_MB,
            }),
          });
          onImageSelected({ id, uri: "", isLoading: false });
          return;
        }

        onImageSelected({ id, uri: compressedUri, isLoading: false });
      } catch {
        onImageSelected({ id, uri: asset.uri, isLoading: false });
      }
    }
  };

  const handleImagePress = () => {
    if (imagesAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxImagesReached", {
          max: MEDIA_LIMITS.MAX_IMAGES,
        }),
      });
      return;
    }

    Alert.alert(
      t("notes:notes.images.addImage"),
      t("common:common.media.imageLimitInfo", {
        size: MEDIA_LIMITS.MAX_IMAGE_SIZE_MB,
      }),
      [
        { text: t("notes:notes.images.takePhoto"), onPress: takePhoto },
        {
          text: t("notes:notes.images.chooseFromLibrary"),
          onPress: pickFromLibrary,
        },
        { text: t("notes:notes.images.cancel"), style: "cancel" },
      ],
    );
  };

  const pickVideoFromLibrary = async () => {
    if (videosAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxVideosReached", {
          max: MEDIA_LIMITS.MAX_VIDEOS,
        }),
      });
      return;
    }

    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes:notes.videos.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Check duration
      const durationSec = (asset.duration ?? 0) / 1000;
      if (durationSec > MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC) {
        Toast.show({
          type: "error",
          text1: t("common:common.media.videoTooLong", {
            max: Math.round(MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC / 60),
          }),
        });
        return;
      }

      // Add video to draft immediately with thumbnail + compressing state
      const id = nanoid();
      const durationMs = Math.round(asset.duration ?? 0);
      const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
        time: 0,
      });
      onVideoSelected?.({
        id,
        uri: asset.uri,
        thumbnailUri: thumbnail.uri,
        durationMs,
        isCompressing: true,
      });

      // Compress in background, then update
      try {
        const compressedUri = await compressVideo(asset.uri);

        // Check file size after compression
        const sizeMB = await getFileSizeMB(compressedUri);
        if (sizeMB > MEDIA_LIMITS.MAX_VIDEO_SIZE_MB) {
          Toast.show({
            type: "error",
            text1: t("common:common.media.videoTooLarge", {
              max: MEDIA_LIMITS.MAX_VIDEO_SIZE_MB,
            }),
          });
          onVideoSelected?.({
            id,
            uri: "",
            thumbnailUri: "",
            durationMs: 0,
            isCompressing: false,
          });
          return;
        }

        onVideoSelected?.({
          id,
          uri: compressedUri,
          thumbnailUri: thumbnail.uri,
          durationMs,
          isCompressing: false,
        });
      } catch {
        // Fallback: use original if compression fails
        onVideoSelected?.({
          id,
          uri: asset.uri,
          thumbnailUri: thumbnail.uri,
          durationMs,
          isCompressing: false,
        });
      }
    }
  };

  const takeVideo = async () => {
    if (videosAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxVideosReached", {
          max: MEDIA_LIMITS.MAX_VIDEOS,
        }),
      });
      return;
    }

    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes:notes.videos.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Add video to draft immediately with thumbnail + compressing state
      const id = nanoid();
      const durationMs = Math.round(asset.duration ?? 0);
      const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
        time: 0,
      });
      onVideoSelected?.({
        id,
        uri: asset.uri,
        thumbnailUri: thumbnail.uri,
        durationMs,
        isCompressing: true,
      });

      // Compress in background, then update
      try {
        const compressedUri = await compressVideo(asset.uri);

        // Check file size after compression
        const sizeMB = await getFileSizeMB(compressedUri);
        if (sizeMB > MEDIA_LIMITS.MAX_VIDEO_SIZE_MB) {
          Toast.show({
            type: "error",
            text1: t("common:common.media.videoTooLarge", {
              max: MEDIA_LIMITS.MAX_VIDEO_SIZE_MB,
            }),
          });
          onVideoSelected?.({
            id,
            uri: "",
            thumbnailUri: "",
            durationMs: 0,
            isCompressing: false,
          });
          return;
        }

        onVideoSelected?.({
          id,
          uri: compressedUri,
          thumbnailUri: thumbnail.uri,
          durationMs,
          isCompressing: false,
        });
      } catch {
        // Fallback: use original if compression fails
        onVideoSelected?.({
          id,
          uri: asset.uri,
          thumbnailUri: thumbnail.uri,
          durationMs,
          isCompressing: false,
        });
      }
    }
  };

  const handleVideoPress = () => {
    if (videosAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxVideosReached", {
          max: MEDIA_LIMITS.MAX_VIDEOS,
        }),
      });
      return;
    }

    Alert.alert(
      t("notes:notes.videos.addVideo"),
      t("common:common.media.videoLimitInfo", {
        duration: Math.round(MEDIA_LIMITS.MAX_VIDEO_DURATION_SEC / 60),
        size: MEDIA_LIMITS.MAX_VIDEO_SIZE_MB,
      }),
      [
        { text: t("notes:notes.videos.takeVideo"), onPress: takeVideo },
        {
          text: t("notes:notes.videos.chooseFromLibrary"),
          onPress: pickVideoFromLibrary,
        },
        { text: t("notes:notes.videos.cancel"), style: "cancel" },
      ],
    );
  };

  const handleRecordingPress = () => {
    if (voiceAtLimit) {
      Toast.show({
        type: "info",
        text1: t("common:common.media.maxVoiceReached", {
          max: MEDIA_LIMITS.MAX_VOICE_RECORDINGS,
        }),
      });
      return;
    }

    setShowRecordingModal(true);
  };

  const hasFolderSelected = selectedFolderId !== null;
  const showFolder = showFolderButton && folders.length > 0;

  return (
    <>
      <View className="bg-blue-800 border-[1.5px] border-blue-500 rounded-md flex-row overflow-hidden">
        <AnimatedButton
          onPress={handleRecordingPress}
          className="flex-1 py-1.5 items-center justify-center"
        >
          <Mic color={voiceAtLimit ? "#6b7280" : "white"} size={20} />
        </AnimatedButton>

        <View className="w-px bg-blue-500" />

        <AnimatedButton
          onPress={handleImagePress}
          className="flex-1 py-1.5 items-center justify-center"
        >
          <ImagePlus color={imagesAtLimit ? "#6b7280" : "white"} size={20} />
        </AnimatedButton>

        {onVideoSelected && (
          <>
            <View className="w-px bg-blue-500" />
            <AnimatedButton
              onPress={handleVideoPress}
              className="flex-1 py-1.5 items-center justify-center"
            >
              <Video color={videosAtLimit ? "#6b7280" : "white"} size={20} />
            </AnimatedButton>
          </>
        )}

        {showFolder && (
          <>
            <View className="w-px bg-blue-500" />

            <AnimatedButton
              onPress={() => setShowFolderModal(true)}
              className="flex-1 py-1.5 items-center justify-center"
            >
              <FolderOpen
                color={hasFolderSelected ? "#3b82f6" : "white"}
                size={20}
              />
            </AnimatedButton>
          </>
        )}
      </View>

      <RecordingModal
        visible={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onRecordingComplete={onRecordingComplete}
      />

      <Modal
        visible={showFolderModal}
        onRequestClose={() => setShowFolderModal(false)}
        transparent
        animationType="fade"
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setShowFolderModal(false)}
        >
          <View
            style={{ maxHeight: "75%", width: screenWidth * 0.85 }}
            className="border-2 border-slate-300 rounded-xl bg-slate-900 py-5 justify-center"
          >
            <AppText className="mb-6 text-center text-xl px-4">
              {t("notes:notes.folders.saveToFolder")}
            </AppText>
            <ScrollView>
              <AnimatedButton
                onPress={() => {
                  onFolderSelect(null);
                  setShowFolderModal(false);
                }}
                className={`flex-row items-center border p-2 my-2 rounded-xl mx-6 px-4 ${
                  !selectedFolderId
                    ? "bg-blue-900/40 border-blue-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText className="text-xl flex-1">
                  {t("notes:notes.folders.noFolder")}
                </AppText>
                {!selectedFolderId && (
                  <View className="ml-auto">
                    <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                      <AppText className="text-sm">✓</AppText>
                    </View>
                  </View>
                )}
              </AnimatedButton>

              {folders.map((folder) => (
                <AnimatedButton
                  key={folder.id}
                  onPress={() => {
                    onFolderSelect(folder.id);
                    setShowFolderModal(false);
                  }}
                  className={`flex-row items-center border p-2 my-2 rounded-xl mx-6 px-4 ${
                    selectedFolderId === folder.id
                      ? "bg-blue-900/40 border-blue-500"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <AppText className="text-xl flex-1">{folder.name}</AppText>
                  {selectedFolderId === folder.id && (
                    <View className="ml-auto">
                      <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                        <AppText className="text-sm">✓</AppText>
                      </View>
                    </View>
                  )}
                </AnimatedButton>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
