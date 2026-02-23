import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import ProfilePicture from "@/components/ProfilePicture";
import SelectInput from "@/components/Selectinput";
import SaveButton from "@/components/buttons/SaveButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { File } from "expo-file-system";
import { saveUserProfile } from "@/database/settings/save-user-profile";
import { validateUserName } from "@/database/settings/validateUserName";
import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import PageContainer from "@/components/PageContainer";
import mime from "mime";
import { useTranslation } from "react-i18next";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("");
  const [selectedProfilePic, setSelectedProfilePic] =
    useState<UploadFile | null>(null);

  const userNameZ = useUserStore((state) => state.profile?.display_name);
  const weightUnitZ = useUserStore((state) => state.profile?.weight_unit);
  const profilePicZ = useUserStore((state) => state.profile?.profile_picture);

  const setUserProfile = useUserStore((state) => state.setUserProfile);

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
        text1: t("common.error"),
        text2: t("profile.profilePictureSizeError"),
      });
      return profilePicZ || null;
    }

    const fileType = mime.getType(selectedProfilePic.uri);
    if (
      fileType !== "image/jpeg" &&
      fileType !== "image/png" &&
      fileType !== "image/webp"
    ) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("profile.profilePictureFormatError"),
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

      formData.append("file", {
        uri: selectedProfilePic.uri,
        name: selectedProfilePic.name || "profile.jpg",
        type: mime.getType(selectedProfilePic.uri) || "image/jpeg",
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/settings/save-profilePic`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (result.error) {
        throw new Error("Failed to upload image");
      }

      return `${result.publicUrl}?v=${Date.now()}`;
    } catch {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("menu:profile.profilePictureUploadError"),
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
          : (profilePicZ ?? null);

      const isTaken = await validateUserName(userName);

      if (isTaken) {
        return Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("profile.userNameTaken"),
        });
      }

      const payload = {
        display_name: userName,
        weight_unit: weightUnit,
        profile_picture: profilePictureUrl,
      };

      await saveUserProfile(payload);

      setUserProfile(payload);
      Toast.show({
        type: "success",
        text1: t("menu:profile.updateSuccess"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("menu:profile.updateError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="justify-between">
          <View>
            <View>
              <AppText className="text-2xl text-center mb-10">
                {t("menu:profile.title")}
              </AppText>
            </View>
            <AppInput
              value={userName}
              setValue={(value) => {
                setUserName(
                  value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 15),
                );
              }}
              label={t("menu:profile.userName")}
            />
            <AppText className="text-sm text-gray-500 mt-2">
              {t("menu:profile.userNameHint")}
            </AppText>
            <View className="mt-10">
              <ProfilePicture
                data={profilePicZ || null}
                onFileSelected={setSelectedProfilePic}
              />
              <AppText className="text-sm text-gray-500 mt-2">
                {t("menu:profile.profilePictureHint")}
              </AppText>
            </View>
            <View className="mt-10">
              <SelectInput
                topLabel={t("menu:profile.weightUnit")}
                label={t("menu:profile.weightUnit")}
                value={weightUnit}
                onChange={setWeightUnit}
                options={[
                  { value: "kg", label: "kg" },
                  { value: "lbs", label: "lbs" },
                ]}
              />
            </View>
          </View>
          <View>
            <SaveButton
              onPress={async () => {
                if (!userName.trim()) {
                  Toast.show({
                    type: "error",
                    text1: t("common.error"),
                    text2: t("menu:profile.userNameEmpty"),
                  });
                  return;
                }

                await updateSettings();
              }}
            />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader
        visible={isSaving}
        message={t("menu:profile.savingProfile")}
      />
    </>
  );
}
