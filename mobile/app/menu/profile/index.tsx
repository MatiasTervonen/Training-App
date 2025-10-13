import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ProfilePicture from "@/components/ProfilePicture";
import SelectInput from "@/components/Selectinput";
import SaveButton from "@/components/SaveButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { File } from "expo-file-system";
import { saveSettings } from "@/api/settings/save-settings";
import { validateUserName } from "@/api/settings/validateUserName";
import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

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

  const setPreferences = useUserStore((state) => state.setUserPreferences);

  useEffect(() => {
    setUserName(userNameZ || "");
    setWeightUnit(weightUnitZ || "kg");
    setSelectedProfilePic(null);
  }, [userNameZ, weightUnitZ, profilePicZ]);

  const checkFileSize = async (uri: string) => {
    try {
      const file = new File(uri);
      const info = await file.info();
      if (info.exists && typeof info.size === "number") {
        return info.size; // size is in bytes
      }
    } catch (error) {
      handleError(error, {
        message: "Error checking file size",
        route: "/menu/profile",
        method: "CHECK",
      });
    }
    return 0;
  };

  const saveProfilePicture = async () => {
    if (!selectedProfilePic) return profilePicZ || null;

    const fileSize = await checkFileSize(selectedProfilePic.uri);

    if (fileSize > 5 * 1024 * 1024) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "File size exceeds 5MB limit.",
      });
      return profilePicZ || null;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        return { error: true, message: "No session" };
      }

      const formData = new FormData();

      console.log("Selected:", selectedProfilePic);

      formData.append("file", selectedProfilePic as unknown as Blob);

      console.log("Uploading file:", formData);

      console.log("Access token:", session.access_token);


      const response = await fetch(
        "https://training-app-bay.vercel.app/api/settings/save-profilePic",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.error) {
        console.log("Upload response:", response.status, result);
        throw new Error("Failed to upload image");
      }

      return `${result.publicUrl}?v=${Date.now()}`;
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

  const updateSettings = async () => {
    setIsSaving(true);
    try {
      const uploadedProfilePic = await saveProfilePicture();

      const profilePictureUrl =
        typeof uploadedProfilePic === "string"
          ? uploadedProfilePic
          : profilePicZ ?? null;

      const isTaken = await validateUserName(userName);

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

      const result = await saveSettings(payload);

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
    } catch (error) {
      handleError(error, {
        message: "Error saving settings",
        route: "/api/settings/save-settings",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An unexpected error occurred while saving settings.",
      });
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                Max size 5MB. JPEG or PNG format.
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
                if (!userName.trim()) {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "User name cannot be empty.",
                  });
                  return;
                }

                await updateSettings();
              }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving..." />
    </>
  );
}
