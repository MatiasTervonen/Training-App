import { Alert } from "react-native";
import * as ExpoImagePicker from "expo-image-picker";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ImagePlus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type Props = {
  onImageSelected: (uri: string) => void;
};

export default function ImagePicker({ onImageSelected }: Props) {
  const { t } = useTranslation("notes");

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

  const handlePress = () => {
    Alert.alert(t("notes.images.addImage"), undefined, [
      { text: t("notes.images.takePhoto"), onPress: takePhoto },
      { text: t("notes.images.chooseFromLibrary"), onPress: pickFromLibrary },
      { text: t("notes.images.cancel"), style: "cancel" },
    ]);
  };

  return (
    <AnimatedButton
      label={t("notes.images.addImage")}
      onPress={handlePress}
      className="bg-blue-800 border-blue-500 border-2 py-2 rounded-md flex-row items-center justify-center gap-2"
    >
      <ImagePlus color="white" size={24} />
    </AnimatedButton>
  );
}
