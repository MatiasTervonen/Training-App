import { View, ScrollView, Platform, Linking, AppState } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingLayout from "@/features/onboarding/OnboardingLayout";
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
import { useUserStore } from "@/lib/stores/useUserStore";
import {
  registerForPushNotificationsAsync,
  SaveTokenToServer,
} from "@/features/push-notifications/actions";
import { updateGpsTrackingStatus } from "@/features/activities/gpsToggle/actions";
import { updatePushEnabledStatus } from "@/features/push-notifications/updatePushEnabledStatus";

export default function PermissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [notificationsPermanentlyDenied, setNotificationsPermanentlyDenied] =
    useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationPermanentlyDenied, setLocationPermanentlyDenied] =
    useState(false);
  const [stepsGranted, setStepsGranted] = useState(false);
  const [stepsPermanentlyDenied, setStepsPermanentlyDenied] = useState(false);
  const [exactAlarmGranted, setExactAlarmGranted] = useState(false);
  const [batteryOptDisabled, setBatteryOptDisabled] = useState(false);

  const checkPermissions = useCallback(async () => {
    const [notifStatus, fg, bg] = await Promise.all([
      Notifications.getPermissionsAsync(),
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
    ]);
    setNotificationsGranted(notifStatus.status === "granted");
    setNotificationsPermanentlyDenied(
      notifStatus.status === "denied" && !notifStatus.canAskAgain,
    );
    setLocationGranted(fg.status === "granted" && bg.status === "granted");
    setLocationPermanentlyDenied(
      fg.status === "denied" && !fg.canAskAgain,
    );

    if (Platform.OS === "android") {
      const [hasSteps, canAlarm, ignoring] = await Promise.all([
        hasStepPermission(),
        canUseExactAlarm(),
        isIgnoringBatteryOptimizations(),
      ]);
      setStepsGranted(hasSteps);
      setExactAlarmGranted(canAlarm);
      setBatteryOptDisabled(ignoring);

      if (!hasSteps) {
        const denied = await isStepPermissionPermanentlyDenied();
        setStepsPermanentlyDenied(denied);
      }
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
    const result = await Notifications.requestPermissionsAsync();
    const granted = result.status === "granted";
    setNotificationsGranted(granted);
    if (!granted && !result.canAskAgain) {
      setNotificationsPermanentlyDenied(true);
    }

    if (granted) {
      try {
        const platform = Platform.OS === "ios" ? "ios" : "android";
        const token = await registerForPushNotificationsAsync(t);
        if (token) {
          await SaveTokenToServer(token, platform);
          await updatePushEnabledStatus(true);
          useUserStore.getState().setUserSettings({ push_enabled: true });
        }
      } catch {
        // OS permission granted but token registration failed — user can retry in Settings
      }
    }
  };

  const handleEnableLocation = async () => {
    const fgResult = await Location.requestForegroundPermissionsAsync();
    if (fgResult.status !== "granted") {
      if (!fgResult.canAskAgain) setLocationPermanentlyDenied(true);
      return;
    }

    const bgResult = await Location.requestBackgroundPermissionsAsync();
    const granted = bgResult.status === "granted";
    setLocationGranted(granted);
    if (!granted && !bgResult.canAskAgain) {
      setLocationPermanentlyDenied(true);
    }

    if (granted) {
      try {
        await updateGpsTrackingStatus(true);
        useUserStore.getState().setUserSettings({
          gps_tracking_enabled: true,
        });
      } catch {
        // OS permission granted but DB update failed — user can retry in Settings
      }
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

  const handleEnableExactAlarm = () => {
    requestExactAlarm();
    // AppState listener re-checks permissions when user returns from system settings
  };

  const handleDisableBatteryOpt = async () => {
    await requestIgnoreBatteryOptimizations();
    // AppState listener re-checks permissions when user returns from system settings
  };

  return (
    <OnboardingLayout
      currentStep={2}
      footer={
        <>
          <AnimatedButton
            onPress={() => router.push("/onboarding/profile")}
            className="btn-base py-3"
            label={t("permissions.continue")}
            textClassName="text-lg"
          />
          <SkipOnboardingButton onSkip={skipOnboarding} />
        </>
      }
    >
      <View className="flex-1">
        <AppText className="text-3xl text-center mt-4 mb-2">
          {t("permissions.title")}
        </AppText>
        <BodyText className="text-center mb-4">
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
            isPermanentlyDenied={notificationsPermanentlyDenied}
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
            isPermanentlyDenied={locationPermanentlyDenied}
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
      </View>
    </OnboardingLayout>
  );
}
