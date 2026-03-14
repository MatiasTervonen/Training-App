import {
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import ProfilePicture from "@/components/ProfilePicture";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import OnboardingBackButton from "@/features/onboarding/OnboardingBackButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { validateUserName } from "@/database/settings/validateUserName";
import { saveUserProfile } from "@/database/settings/save-user-profile";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";
import mime from "mime";
import { File } from "expo-file-system";
import FullScreenLoader from "@/components/FullScreenLoader";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const existingName = useUserStore((state) => state.profile?.display_name) ?? "";

  const [userName, setUserName] = useState("");
  const [selectedProfilePic, setSelectedProfilePic] =
    useState<UploadFile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!selectedProfilePic) return null;

    try {
      const file = new File(selectedProfilePic.uri);
      const info = await file.info();
      if (info.exists && typeof info.size === "number" && info.size > 5 * 1024 * 1024) {
        Toast.show({
          type: "error",
          text1: t("common:error", { defaultValue: "Error" }),
          text2: t("profile.pictureSizeError"),
        });
        return null;
      }
    } catch {
      // Continue with upload attempt
    }

    const fileType = mime.getType(selectedProfilePic.uri);
    if (
      fileType !== "image/jpeg" &&
      fileType !== "image/png" &&
      fileType !== "image/webp"
    ) {
      Toast.show({
        type: "error",
        text1: t("common:error", { defaultValue: "Error" }),
        text2: t("profile.pictureFormatError"),
      });
      return null;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return null;

      const formData = new FormData();
      formData.append("file", {
        uri: selectedProfilePic.uri,
        name: selectedProfilePic.name || "profile.jpg",
        type: mime.getType(selectedProfilePic.uri) || "image/jpeg",
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL_PROD}/api/settings/save-profilePic-mobile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();
      if (result.error) return null;

      return `${result.publicUrl}?v=${Date.now()}`;
    } catch {
      return null;
    }
  };

  const handleContinue = async () => {
    const trimmedName = userName.trim();
    const nameToSave = trimmedName || existingName;
    const hasChanges = trimmedName || selectedProfilePic;

    if (!hasChanges) {
      router.push("/onboarding/about-you");
      return;
    }

    setIsSaving(true);
    try {
      if (trimmedName && trimmedName !== existingName) {
        const isTaken = await validateUserName(trimmedName);
        if (isTaken) {
          Toast.show({
            type: "error",
            text1: t("common:error", { defaultValue: "Error" }),
            text2: t("profile.userNameTaken"),
          });
          setIsSaving(false);
          return;
        }
      }

      const profilePictureUrl = await uploadProfilePicture();

      const payload: {
        display_name: string;
        profile_picture: string | null;
        weight_unit: string;
        distance_unit: string;
      } = {
        display_name: nameToSave,
        profile_picture:
          profilePictureUrl ??
          (useUserStore.getState().profile?.profile_picture || null),
        weight_unit: useUserStore.getState().profile?.weight_unit || "kg",
        distance_unit: useUserStore.getState().profile?.distance_unit || "km",
      };

      await saveUserProfile(payload);
      useUserStore.getState().setUserProfile({
        display_name: nameToSave,
        profile_picture: payload.profile_picture,
      });
    } catch {
      // Saved locally via store, will sync later
    } finally {
      setIsSaving(false);
    }

    router.push("/onboarding/about-you");
  };


  return (
    <>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          className="flex-1 px-6 justify-center"
          onPress={Keyboard.dismiss}
        >
          <OnboardingBackButton />
          <OnboardingProgressBar currentStep={3} />

          <View className="mt-8">
            <AppText className="text-3xl text-center mb-4">
              {t("profile.title")}
            </AppText>
            <BodyText className="text-center text-base mb-8">
              {t("profile.description")}
            </BodyText>
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
            label={t("profile.userName")}
            placeholder={existingName}
          />
          <AppText className="text-sm text-gray-500 mt-2">
            {t("profile.userNameHint")}
          </AppText>

          <View className="mt-8">
            <ProfilePicture onFileSelected={setSelectedProfilePic} />
          </View>

          <View className="mt-8">
            <AnimatedButton
              onPress={handleContinue}
              className="btn-base py-3"
              label={t("profile.continue")}
              textClassName="text-lg"
              disabled={isSaving}
            />

            <SkipOnboardingButton onSkip={skipOnboarding} />
          </View>
        </Pressable>
      </KeyboardAvoidingView>
      <FullScreenLoader
        visible={isSaving}
        message={t("profile.saving")}
      />
    </>
  );
}
