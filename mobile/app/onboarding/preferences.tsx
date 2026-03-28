import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingLayout from "@/features/onboarding/OnboardingLayout";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import DatePicker from "react-native-date-picker";

export default function PreferencesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const currentDistanceUnit = useUserStore(
    (state) =>
      state.profile?.distance_unit ?? (i18n.language === "fi" ? "km" : "mi"),
  );

  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">(
    currentDistanceUnit === "mi" ? "mi" : "km",
  );
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleContinue = () => {
    const profileUpdates: Record<string, string | null> = {
      distance_unit: distanceUnit,
    };

    if (gender) {
      profileUpdates.gender = gender;
    }
    if (birthDate) {
      profileUpdates.birth_date = birthDate.toISOString().split("T")[0];
    }

    useUserStore.getState().setUserProfile(profileUpdates);
    router.push("/onboarding/complete");
  };

  return (
    <OnboardingLayout
      currentStep={5}
      footer={
        <>
          <AnimatedButton
            onPress={handleContinue}
            className="btn-base py-3"
            label={t("preferences.continue")}
            textClassName="text-lg"
          />
          <SkipOnboardingButton onSkip={skipOnboarding} />
        </>
      }
    >
      <View>
        <AppText className="text-2xl text-center mb-2">
          {t("preferences.title")}
        </AppText>
        <BodyText className="text-center mb-8">
          {t("preferences.description")}
        </BodyText>

        {/* Gender section */}
        <AppText className="text-lg text-center mb-3">
          {t("aboutYou.genderTitle")}
        </AppText>
        <View className="flex-row justify-center mb-6 gap-3">
          <AnimatedButton
            onPress={() => setGender("male")}
            className={`w-24 py-2 rounded-lg border-[1.5px] items-center ${
              gender === "male"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={gender === "male" ? "text-blue-400" : "text-slate-400"}
            >
              {t("aboutYou.genderMale")}
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setGender("female")}
            className={`w-24 py-2 rounded-lg border-[1.5px] items-center ${
              gender === "female"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={gender === "female" ? "text-blue-400" : "text-slate-400"}
            >
              {t("aboutYou.genderFemale")}
            </AppText>
          </AnimatedButton>
        </View>

        {/* Birth date section */}
        <AppText className="text-lg text-center mb-3">
          {t("aboutYou.birthDateTitle")}
        </AppText>
        <View className="items-center mb-6">
          <AnimatedButton
            onPress={() => setShowDatePicker(true)}
            className="bg-slate-800 border-[1.5px] border-slate-700 rounded-lg py-2 px-6"
          >
            <AppText className="text-xl text-center">
              {birthDate
                ? birthDate.toLocaleDateString(i18n.language, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : t("aboutYou.birthDatePlaceholder")}
            </AppText>
          </AnimatedButton>
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
        </View>

        {/* Distance unit section */}
        <AppText className="text-lg text-center mb-3">
          {t("preferences.distanceUnit")}
        </AppText>
        <View className="flex-row justify-center gap-3">
          <AnimatedButton
            onPress={() => setDistanceUnit("km")}
            className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
              distanceUnit === "km"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={
                distanceUnit === "km" ? "text-blue-400" : "text-slate-400"
              }
            >
              km
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setDistanceUnit("mi")}
            className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
              distanceUnit === "mi"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={
                distanceUnit === "mi" ? "text-blue-400" : "text-slate-400"
              }
            >
              mi
            </AppText>
          </AnimatedButton>
        </View>
      </View>
    </OnboardingLayout>
  );
}
