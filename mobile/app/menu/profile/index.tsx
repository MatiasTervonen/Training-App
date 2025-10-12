import { View } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ProfilePicture from "@/components/ProfilePicture";
import SelectInput from "@/components/Selectinput";
import SaveButton from "@/components/SaveButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { fetch as expoFetch } from "expo/fetch";
import * as FileSystem from "expo-file-system";
import { saveSettings } from "@/api/settings/save-settings";
import { validateUserName } from "@/api/settings/validateUserName";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("");
  const [selectedProfilePic, setSelectedProfilePic] =
    useState<UploadFile | null>(null);

  const userNameZ = useUserStore((state) => state.preferences?.display_name);
  const weightUnitZ = useUserStore((state) => state.preferences?.weight_unit);
  const profilePicZ = useUserStore(
    (state) => state.preferences?.profile_picture
  );
  const session = useUserStore((state) => state.session);

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  useEffect(() => {
    setUserName(userNameZ || "");
    setWeightUnit(weightUnitZ || "kg");
    setSelectedProfilePic(null);
  }, [userNameZ, weightUnitZ, profilePicZ]);

  const checkFileSize = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && typeof fileInfo.size === "number") {
      return fileInfo.size; // size is in bytes
    }
    return 0;
  };

  const saveProfilePicture = async (session: Session) => {
    if (!selectedProfilePic) return profilePicZ || null;

    const fileSize = await checkFileSize(selectedProfilePic.uri);

    if (fileSize > 5 * 1024 * 1024) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "File size exceeds 5MB limit.",
      });
      return;
    }

    try {
      const fileResponse = await fetch(selectedProfilePic.uri);
      const blob = await fileResponse.blob();

      const formData = new FormData();
      formData.append("file", blob);

      const response = await expoFetch(
        "https://training-app-bay.vercel.app/api/settings/save-profilePic",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            // 'Content-Type' will be set automatically by fetch when using FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      return `${data.publicUrl}?v=${Date.now()}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload profile picture",
      });
      return profilePicZ || null;
    }
  };

  const updateSettings = async (session: Session) => {
    setIsSaving(true);

    const profilePictureUrl = await saveProfilePicture(session);

    if (!profilePictureUrl) {
      setIsSaving(false);
      return;
    }

    const isTaken = await validateUserName(userName, session);

    if (isTaken === null) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Error checking user name.",
      });
      setIsSaving(false);
      return;
    }

    if (isTaken === true) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User name is already taken. Please choose another.",
      });
      setIsSaving(false);
      return; // User name is taken
    }

    const payload = {
      display_name: userName,
      weight_unit: weightUnit,
      profile_picture: profilePictureUrl,
    };

    const result = await saveSettings(payload, session);

    if (result === null) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save settings.",
      });
      setIsSaving(false);
      return;
    }

    if (result === true) {
      setPreferences(payload);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Settings saved successfully.",
      });
      setIsSaving(false);
      return;
    }
  };

  return (
    <>
      <View className="flex-1 justify-between px-10">
        <View>
          <View>
            <AppText className="text-2xl text-center my-5">
              Profile Settings
            </AppText>
          </View>
          <AppInput
            value={userName}
            onChangeText={(value) => {
              setUserName(
                value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "")
                  .slice(0, 15)
              );
            }}
            label="User Name"
          />
          <AppText className="text-sm text-gray-500 mt-2">
            Max 15 characters. Only lowercase letters, numbers, &quot;_&quot;
            allowed.
          </AppText>
          <View className="mt-10">
            <ProfilePicture
              data={profilePicZ || null}
              onFileSelected={setSelectedProfilePic}
            />
            <AppText className="text-sm text-gray-500 mt-2">
              Max size 5MB.
            </AppText>
          </View>
          <View className="mt-10">
            <SelectInput
              label={"Weight Unit"}
              value={weightUnit}
              onChange={setWeightUnit}
              options={[
                { value: "kg", label: "kg" },
                { value: "lbs", label: "lbs" },
              ]}
            />
          </View>
        </View>
        <View className="mb-10">
          <SaveButton
            onPress={async () => {
              if (!session) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "No active session. Please log in again.",
                });
                return;
              }

              if (!userName.trim()) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "User name cannot be empty.",
                });
                return;
              }

              await updateSettings(session);
            }}
          />
        </View>
      </View>
      <FullScreenLoader visible={isSaving} message="Saving..." />
    </>
  );
}
