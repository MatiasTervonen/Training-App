import { View } from "react-native";
import AppText from "@/app/components/AppText";
import Screen from "@/app/components/Screen";
import AppInput from "@/app/components/AppInput";
import ProfilePicture from "../components/ProfilePicture";
import SelectInput from "@/app/components/Selectinput";
import SaveButton from "@/app/components/SaveButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/app/components/FullScreenLoader";
import { fetch as expoFetch } from "expo/fetch";
import * as FileSystem from "expo-file-system";
import { isUserNameTaken } from "@/app/utils/isUserNameTaken";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
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

  const saveProfilePicture = async (session: Session | null) => {
    if (!session) return null;

    if (!selectedProfilePic) return profilePicZ || null;

    const fileSize = await checkFileSize(selectedProfilePic.uri);

    if (fileSize > 5 * 1024 * 1024) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "File size exceeds 5MB limit.",
      });
      return null;
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

  const updateSettings = async (session: Session | null) => {
    if (!session) return null;

    setIsSaving(true);

    const profilePictureUrl = await saveProfilePicture(session);

    if (!profilePictureUrl) {
      setIsSaving(false);
      return;
    }

    const taken = await validateUserName(userName);

    if (taken === true) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User name is already taken.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      display_name: userName,
      weight_unit: weightUnit,
      profile_picture: profilePictureUrl,
    };

    console.log("Updating settings with payload:", payload);

    try {
      const response = await fetch(
        "https://training-app-bay.vercel.app/api/settings/save-settings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setPreferences(payload);
      Toast.show({
        type: "success",
        text1: "Settings updated successfully!",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateUserName = async (name: string) => {
    const taken = await isUserNameTaken(name, session);

    if (taken === null) {
      // means an error happened (in fetch or otherwise)
      return null;
    }

    if (taken) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User name is already taken.",
      });

      return true;
    }

    return false;
  };

  return (
    <Screen>
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
                  text2: "You must be logged in to save settings.",
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
    </Screen>
  );
}
