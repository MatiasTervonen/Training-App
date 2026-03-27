import { View, ScrollView, TextInput } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import ProfilePicture from "@/components/ProfilePicture";
import SaveButton from "@/components/buttons/SaveButton";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import FullScreenLoader from "@/components/FullScreenLoader";
import { File } from "expo-file-system";
import { saveUserProfile } from "@/database/settings/save-user-profile";
import { validateUserName } from "@/database/settings/validateUserName";
import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/utils/apiUrl";
import PageContainer from "@/components/PageContainer";
import mime from "mime";
import { useTranslation } from "react-i18next";
import DatePicker from "react-native-date-picker";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <BodyText className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
        {title}
      </BodyText>
      <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${
        !isLast ? "border-b border-slate-700/50" : ""
      }`}
    >
      <BodyText className="text-sm">{label}</BodyText>
      {children}
    </View>
  );
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {options.map((opt) => (
        <AnimatedButton
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`items-center px-5 py-1.5 ${
            value === opt.value ? "bg-blue-900/50" : ""
          }`}
        >
          <AppText
            className={`text-sm ${
              value === opt.value ? "text-blue-400" : "text-slate-500"
            }`}
          >
            {opt.label}
          </AppText>
        </AnimatedButton>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [weightUnit, setWeightUnit] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [selectedProfilePic, setSelectedProfilePic] =
    useState<UploadFile | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const userNameZ = useUserStore((state) => state.profile?.display_name);
  const weightUnitZ = useUserStore((state) => state.profile?.weight_unit);
  const distanceUnitZ = useUserStore((state) => state.profile?.distance_unit);
  const profilePicZ = useUserStore((state) => state.profile?.profile_picture);
  const heightCmZ = useUserStore((state) => state.profile?.height_cm);
  const genderZ = useUserStore((state) => state.profile?.gender);
  const birthDateZ = useUserStore((state) => state.profile?.birth_date);

  const setUserProfile = useUserStore((state) => state.setUserProfile);

  useEffect(() => {
    setUserName(userNameZ || "");
    setWeightUnit(weightUnitZ || "kg");
    setDistanceUnit(distanceUnitZ || "km");
    setHeightCm(heightCmZ ? String(heightCmZ) : "");
    if (heightCmZ) {
      const totalInches = heightCmZ / 2.54;
      setHeightFt(String(Math.floor(totalInches / 12)));
      setHeightIn(String(Math.round(totalInches % 12)));
    } else {
      setHeightFt("");
      setHeightIn("");
    }
    setGender(genderZ ?? null);
    setBirthDate(birthDateZ ? new Date(birthDateZ) : null);
    setSelectedProfilePic(null);
  }, [userNameZ, weightUnitZ, distanceUnitZ, profilePicZ, heightCmZ, genderZ, birthDateZ]);

  const checkFileSize = async (uri: string) => {
    try {
      const file = new File(uri);
      const info = await file.info();
      if (info.exists && typeof info.size === "number") {
        return info.size;
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
        `${API_URL}/api/settings/save-profilePic-mobile`,
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
    } catch (error) {
      console.error("Error uploading profile picture:", error);
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
      const [uploadedProfilePic, isTaken] = await Promise.all([
        saveProfilePicture(),
        validateUserName(userName),
      ]);

      const profilePictureUrl =
        typeof uploadedProfilePic === "string"
          ? uploadedProfilePic
          : (profilePicZ ?? null);

      if (isTaken) {
        return Toast.show({
          type: "error",
          text1: t("common.error"),
          text2: t("profile.userNameTaken"),
        });
      }

      let parsedHeight: number | null = null;
      if (distanceUnit === "mi") {
        const ft = parseFloat(heightFt) || 0;
        const inches = parseFloat(heightIn) || 0;
        if (ft > 0 || inches > 0) {
          parsedHeight = Math.round((ft * 12 + inches) * 2.54);
        }
      } else {
        parsedHeight = heightCm ? parseFloat(heightCm) : null;
      }

      const payload = {
        display_name: userName,
        weight_unit: weightUnit,
        distance_unit: distanceUnit,
        profile_picture: profilePictureUrl,
        height_cm: parsedHeight && parsedHeight > 0 ? parsedHeight : null,
        gender: gender,
        birth_date: birthDate ? birthDate.toISOString().split("T")[0] : null,
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
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <PageContainer className="justify-between">
          <View>
            {/* Profile picture + username hero */}
            <View className="items-center pt-2 pb-4">
              <ProfilePicture
                data={profilePicZ || null}
                onFileSelected={setSelectedProfilePic}
                size={100}
              />
              <BodyText className="text-xs text-slate-500 mt-2">
                {t("menu:profile.profilePictureHint")}
              </BodyText>
            </View>

            {/* Username */}
            <View className="mt-2">
              <BodyText className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
                {t("menu:profile.userName")}
              </BodyText>
              <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4">
                <TextInput
                  value={userName}
                  onChangeText={(value) => {
                    setUserName(
                      value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 15),
                    );
                  }}
                  placeholderTextColor="#64748b"
                  autoCorrect={false}
                  spellCheck={false}
                  allowFontScaling={false}
                  className="text-gray-100 text-lg font-russo"
                  style={{ height: 48, textAlignVertical: "center" }}
                  maxLength={15}
                />
              </View>
              <BodyText className="text-xs text-slate-500 mt-1 px-1">
                {t("menu:profile.userNameHint")}
              </BodyText>
            </View>

            {/* Units section */}
            <SectionCard title={t("menu:profile.unitsSection")}>
              <SettingsRow label={t("menu:profile.weightUnit")}>
                <UnitToggle
                  value={weightUnit}
                  options={[
                    { value: "kg", label: "kg" },
                    { value: "lbs", label: "lbs" },
                  ]}
                  onChange={setWeightUnit}
                />
              </SettingsRow>
              <SettingsRow label={t("menu:profile.distanceUnit")} isLast>
                <UnitToggle
                  value={distanceUnit}
                  options={[
                    { value: "km", label: "km" },
                    { value: "mi", label: "mi" },
                  ]}
                  onChange={setDistanceUnit}
                />
              </SettingsRow>
            </SectionCard>

            {/* Body section */}
            <SectionCard title={t("menu:profile.bodySection")}>
              {/* Height */}
              <SettingsRow label={distanceUnit === "mi" ? t("menu:profile.heightImperial") : t("menu:profile.heightMetric")}>
                {distanceUnit === "mi" ? (
                  <View className="flex-row items-center gap-1">
                    <TextInput
                      value={heightFt}
                      onChangeText={setHeightFt}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-16 h-12 font-russo"
                      maxLength={1}
                    />
                    <BodyText className="text-xs text-slate-500">ft</BodyText>
                    <TextInput
                      value={heightIn}
                      onChangeText={setHeightIn}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-16 h-12 font-russo ml-1"
                      maxLength={2}
                    />
                    <BodyText className="text-xs text-slate-500">in</BodyText>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1">
                    <TextInput
                      value={heightCm}
                      onChangeText={setHeightCm}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="bg-slate-900 border border-slate-700 rounded-lg text-center text-gray-100 text-base w-20 h-12 font-russo"
                      maxLength={3}
                    />
                    <BodyText className="text-xs text-slate-500">cm</BodyText>
                  </View>
                )}
              </SettingsRow>

              {/* Gender */}
              <SettingsRow label={t("menu:profile.gender")}>
                <UnitToggle
                  value={gender ?? ""}
                  options={[
                    { value: "male", label: t("menu:profile.genderMale") },
                    { value: "female", label: t("menu:profile.genderFemale") },
                  ]}
                  onChange={setGender}
                />
              </SettingsRow>

              {/* Birth date */}
              <SettingsRow label={t("menu:profile.birthDate")} isLast>
                <AnimatedButton
                  onPress={() => setShowDatePicker(true)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5"
                >
                  <AppText className="text-sm">
                    {birthDate
                      ? birthDate.toLocaleDateString(i18n.language, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : t("menu:profile.birthDatePlaceholder")}
                  </AppText>
                </AnimatedButton>
              </SettingsRow>
            </SectionCard>

            <BodyText className="text-xs text-slate-500 mt-2 px-1">
              {t("menu:profile.bodyHint")}
            </BodyText>
          </View>

          <View className="mt-8 mb-2">
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
      </ScrollView>

      <DatePicker
        modal
        mode="date"
        open={showDatePicker}
        date={birthDate ?? new Date(1995, 0, 1)}
        maximumDate={new Date()}
        minimumDate={new Date(1920, 0, 1)}
        onConfirm={(date) => {
          setShowDatePicker(false);
          setBirthDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
        theme="dark"
        locale={i18n.language}
        title={t("common:datePicker.selectDate")}
        confirmText={t("common:datePicker.confirm")}
        cancelText={t("common:datePicker.cancel")}
      />

      <FullScreenLoader
        visible={isSaving}
        message={t("menu:profile.savingProfile")}
      />
    </>
  );
}
