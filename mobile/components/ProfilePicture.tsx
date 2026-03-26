import { View, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Camera } from "lucide-react-native";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

type Props = {
  data?: string | null;
  onFileSelected?: (file: UploadFile | null) => void;
  size?: number;
};

export default function ProfilePicture({
  data,
  onFileSelected,
  size = 100,
}: Props) {
  const { t } = useTranslation("menu");
  const [imageUri, setImageUri] = useState<string>(data || "");
  const [fileName, setFileName] = useState<string>(
    data ? data.split("/").pop() || "image.jpg" : "",
  );

  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      setImageUri(data);
      setFileName(data.split("/").pop() || "image.jpg");
    }
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t("profile.profilePicturePermissionTitle"),
        t("profile.profilePicturePermissionMessage"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = asset.fileName || uri.split("/").pop() || "profile.jpg";
      const extension = uri.split(".").pop()?.toLowerCase();
      const type =
        asset.mimeType ??
        (extension === "png"
          ? "image/png"
          : extension === "jpg" || extension === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream");

      setImageUri(uri);
      setFileName(name);

      if (onFileSelected) {
        onFileSelected({ uri, name, type });
      }
    }
  };

  return (
    <AnimatedButton onPress={pickImage} className="items-center justify-center">
      <View
        style={{ width: size, height: size }}
        className="rounded-full items-center justify-center"
      >
        <Image
          source={
            fileName
              ? { uri: imageUri }
              : require("@/assets/images/default-avatar.png")
          }
          className="w-full h-full rounded-full overflow-hidden"
          contentFit="cover"
          alt="Profile Picture"
        />
        {/* Camera overlay */}
        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 items-center justify-center border-2 border-slate-900">
          <Camera size={14} color="#fff" />
        </View>
      </View>
    </AnimatedButton>
  );
}
