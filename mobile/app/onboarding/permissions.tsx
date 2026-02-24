import { View, ScrollView, Platform, Linking, AppState } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import PermissionCard from "@/features/onboarding/PermissionCard";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MapPin,
  Footprints,
  AlarmClock,
  BatteryWarning,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import {
  hasStepPermission,
  requestStepPermission,
  isStepPermissionPermanentlyDenied,
} from "@/native/android/NativeStepCounter";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";
import {
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
} from "@/native/android/NativeBatteryOptimization";

export default function PermissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [stepsGranted, setStepsGranted] = useState(false);
  const [stepsPermanentlyDenied, setStepsPermanentlyDenied] = useState(false);
  const [exactAlarmGranted, setExactAlarmGranted] = useState(false);
  const [batteryOptDisabled, setBatteryOptDisabled] = useState(false);

  const checkPermissions = useCallback(async () => {
    // Check notifications
    const notifStatus = await Notifications.getPermissionsAsync();
    setNotificationsGranted(notifStatus.status === "granted");

    // Check location (both foreground + background)
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    setLocationGranted(fg.status === "granted" && bg.status === "granted");

    // Check step counter (Android only)
    if (Platform.OS === "android") {
      const hasSteps = await hasStepPermission();
      setStepsGranted(hasSteps);
      if (!hasSteps) {
        const denied = await isStepPermissionPermanentlyDenied();
        setStepsPermanentlyDenied(denied);
      }

      // Check exact alarm
      const canAlarm = await canUseExactAlarm();
      setExactAlarmGranted(canAlarm);

      // Check battery optimization
      const ignoring = await isIgnoringBatteryOptimizations();
      setBatteryOptDisabled(ignoring);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermissions();
    });
    return () => sub.remove();
  }, [checkPermissions]);

  const handleEnableNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsGranted(status === "granted");
  };

  const handleEnableLocation = async () => {
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus === "granted") {
      const { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      setLocationGranted(bgStatus === "granted");
    }
  };

  const handleEnableSteps = async () => {
    const granted = await requestStepPermission();
    setStepsGranted(granted);
    if (!granted) {
      const denied = await isStepPermissionPermanentlyDenied();
      setStepsPermanentlyDenied(denied);
    }
  };

  const handleEnableExactAlarm = async () => {
    requestExactAlarm();
    // Check after a short delay since this opens system settings
    setTimeout(async () => {
      const canAlarm = await canUseExactAlarm();
      setExactAlarmGranted(canAlarm);
    }, 1000);
  };

  const handleDisableBatteryOpt = async () => {
    await requestIgnoreBatteryOptimizations();
    // Check after a short delay since this opens system settings
    setTimeout(async () => {
      const ignoring = await isIgnoringBatteryOptimizations();
      setBatteryOptDisabled(ignoring);
    }, 1000);
  };

  return (
    <View className="flex-1 px-6">
      <View className="pt-6">
        <OnboardingProgressBar currentStep={2} />
      </View>

      <AppText className="text-3xl text-center mt-4 mb-2">
        {t("permissions.title")}
      </AppText>
      <BodyText className="text-center mb-6">
        {t("permissions.subtitle")}
      </BodyText>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PermissionCard
          icon={Bell}
          title={t("permissions.notifications.title")}
          description={t("permissions.notifications.description")}
          isGranted={notificationsGranted}
          onEnable={handleEnableNotifications}
          enableLabel={t("permissions.enable")}
          enabledLabel={t("permissions.enabled")}
          openSettingsLabel={t("permissions.openSettings")}
          onOpenSettings={() => Linking.openSettings()}
        />

        <PermissionCard
          icon={MapPin}
          title={t("permissions.location.title")}
          description={t("permissions.location.description")}
          isGranted={locationGranted}
          onEnable={handleEnableLocation}
          enableLabel={t("permissions.enable")}
          enabledLabel={t("permissions.enabled")}
          openSettingsLabel={t("permissions.openSettings")}
          onOpenSettings={() => Linking.openSettings()}
        />

        {Platform.OS === "android" && (
          <>
            <PermissionCard
              icon={Footprints}
              title={t("permissions.stepCounter.title")}
              description={t("permissions.stepCounter.description")}
              isGranted={stepsGranted}
              onEnable={handleEnableSteps}
              enableLabel={t("permissions.enable")}
              enabledLabel={t("permissions.enabled")}
              openSettingsLabel={t("permissions.openSettings")}
              isPermanentlyDenied={stepsPermanentlyDenied}
              onOpenSettings={() => Linking.openSettings()}
            />

            <PermissionCard
              icon={AlarmClock}
              title={t("permissions.exactAlarms.title")}
              description={t("permissions.exactAlarms.description")}
              isGranted={exactAlarmGranted}
              onEnable={handleEnableExactAlarm}
              enableLabel={t("permissions.enable")}
              enabledLabel={t("permissions.enabled")}
              openSettingsLabel={t("permissions.openSettings")}
              onOpenSettings={() => Linking.openSettings()}
            />

            <PermissionCard
              icon={BatteryWarning}
              title={t("permissions.batteryOptimization.title")}
              description={t("permissions.batteryOptimization.description")}
              isGranted={batteryOptDisabled}
              onEnable={handleDisableBatteryOpt}
              enableLabel={t("permissions.disable")}
              enabledLabel={t("permissions.disabled")}
              openSettingsLabel={t("permissions.openSettings")}
              onOpenSettings={() => Linking.openSettings()}
            />
          </>
        )}

        <View className="h-4" />
      </ScrollView>

      <View className="pb-6">
        <AnimatedButton
          onPress={() => router.push("/onboarding/about-you")}
          className="btn-base py-3"
          label={t("permissions.continue")}
          textClassName="text-lg"
        />
        <SkipOnboardingButton onSkip={skipOnboarding} />
      </View>
    </View>
  );
}
