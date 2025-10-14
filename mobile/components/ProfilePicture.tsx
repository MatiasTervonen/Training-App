import { View, Pressable, Alert } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import AppInput from "@/components/AppInput";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

type Props = {
  data?: string | null;
  onFileSelected?: (file: UploadFile | null) => void;
};

export default function ProfilePicture({ data, onFileSelected }: Props) {
  const [imageUri, setImageUri] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [userPickedImage, setUserPickedImage] = useState(false);

  useEffect(() => {
    if (data) {
      setImageUri(data);
      setFileName(data.split("/").pop() || "image.jpg");
    }
  }, [data]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
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

      setUserPickedImage(true);
      setImageUri(uri);
      setFileName(name);

      if (onFileSelected) {
        onFileSelected({
          uri,
          name,
          type,
        });
      }
    }
  };

  return (
    <>
      <AppText>Profile picture</AppText>
      <View className="w-[80px] h-[80px] rounded-full border-2 border-blue-500 items-center justify-center my-4">
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
      </View>
      <Pressable onPress={pickImage}>
        <AppInput
          placeholderTextColor={"#f3f4f6"}
          editable={false}
          placeholder="Change Profile Picture"
          value={userPickedImage ? fileName : ""}
        />
      </Pressable>
    </>
  );
}
