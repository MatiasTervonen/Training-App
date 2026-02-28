import { View, Alert, Modal, Pressable, ScrollView, Dimensions } from "react-native";
import { useState } from "react";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { Mic, ImagePlus, FolderOpen, Video } from "lucide-react-native";
import * as ExpoImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import RecordingModal from "@/features/notes/components/RecordingModal";
import type { FolderWithCount } from "@/database/notes/get-folders";

type Props = {
  onRecordingComplete: (uri: string, durationMs: number) => void;
  onImageSelected: (uri: string) => void;
  onVideoSelected?: (uri: string, thumbnailUri: string, durationMs: number) => void;
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  showFolderButton?: boolean;
};

export default function MediaToolbar({
  onRecordingComplete,
  onImageSelected,
  onVideoSelected,
  folders,
  selectedFolderId,
  onFolderSelect,
  showFolderButton = true,
}: Props) {
  const { t } = useTranslation("notes");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  const pickFromLibrary = async () => {
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes.images.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes.images.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Alert.alert(t("notes.images.addImage"), undefined, [
      { text: t("notes.images.takePhoto"), onPress: takePhoto },
      { text: t("notes.images.chooseFromLibrary"), onPress: pickFromLibrary },
      { text: t("notes.images.cancel"), style: "cancel" },
    ]);
  };

  const pickVideoFromLibrary = async () => {
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes.videos.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
      const durationMs = Math.round(asset.duration ?? 0);
      onVideoSelected?.(asset.uri, thumbnail.uri, durationMs);
    }
  };

  const takeVideo = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: t("notes.videos.permissionRequired"),
      });
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
      const durationMs = Math.round(asset.duration ?? 0);
      onVideoSelected?.(asset.uri, thumbnail.uri, durationMs);
    }
  };

  const handleVideoPress = () => {
    Alert.alert(t("notes.videos.addVideo"), undefined, [
      { text: t("notes.videos.takeVideo"), onPress: takeVideo },
      { text: t("notes.videos.chooseFromLibrary"), onPress: pickVideoFromLibrary },
      { text: t("notes.videos.cancel"), style: "cancel" },
    ]);
  };

  const hasFolderSelected = selectedFolderId !== null;
  const showFolder = showFolderButton && folders.length > 0;

  return (
    <>
      <View className="btn-base flex-row overflow-hidden">
        <AnimatedButton
          onPress={() => setShowRecordingModal(true)}
          className="py-1 items-center justify-center"
          tabClassName="flex-1"
        >
          <Mic color="white" size={24} />
        </AnimatedButton>

        <View className="w-px bg-blue-500" />

        <AnimatedButton
          onPress={handleImagePress}
          className="py-1 items-center justify-center"
          tabClassName="flex-1"
        >
          <ImagePlus color="white" size={24} />
        </AnimatedButton>

        {onVideoSelected && (
          <>
            <View className="w-px bg-blue-500" />
            <AnimatedButton
              onPress={handleVideoPress}
              className="py-1 items-center justify-center"
              tabClassName="flex-1"
            >
              <Video color="white" size={24} />
            </AnimatedButton>
          </>
        )}

        {showFolder && (
          <>
            <View className="w-px bg-blue-500" />

            <AnimatedButton
              onPress={() => setShowFolderModal(true)}
              className="py-1 items-center justify-center"
              tabClassName="flex-1"
            >
              <FolderOpen
                color={hasFolderSelected ? "#3b82f6" : "white"}
                size={24}
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
              {t("notes.folders.saveToFolder")}
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
                  {t("notes.folders.noFolder")}
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
